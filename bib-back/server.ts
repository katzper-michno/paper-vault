import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { readFile } from "fs/promises";
import { writeFile } from 'fs';
import path from 'path';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  venue: string;
  doi?: string;
  urls: {
    semanticScholar?: string;
    arxiv?: string;
  }
  files?: string[];
  saved?: boolean;
}

interface SearchQuery {
  q?: string;
}

const db_path = (): string => {
  const p = process.env.DB_PATH;
  if (!p) {
    throw Error("Saved papers database path not specified.");
  }
  return path.join(p, 'db.json');
}

const getPapersFromDatabase = async (): Promise<Paper[]> => {
  const file = await readFile(db_path(), "utf-8");
  return JSON.parse(file) as Paper[];
}

const savePapersToDatabase = (papers: Paper[]) => {
  writeFile(db_path(), JSON.stringify(papers, null, 2), (err: any) => {
    if (err) {
      console.error('Error writing file', err);
      throw err;
    }
  })
}

// Function to escape BibTeX special characters
const escapeBibTeX = (str: string): string => {
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\^/g, '\\^{}')
    .replace(/~/g, '\\~{}');
}

// Function to generate BibTeX entry
const generateBibTeX = (paper: Paper): string => {
  const {
    title,
    authors,
    abstract,
    year,
    venue,
  } = paper;

  // Format authors: "Last, First and Last, First"
  const formattedAuthors = authors.join(' and ');

  // Generate a citation key: first author's last name + year
  const citationKey = `${authors[0].split(' ').slice(-1)[0].toLowerCase()}${year}`;

  // Construct BibTeX string
  const bibtex = `@article{${citationKey},
  author = {${escapeBibTeX(formattedAuthors)}},
  title  = {${escapeBibTeX(title)}},
  journal = {${escapeBibTeX(venue)}},
  year   = {${year}},
  abstract = {${escapeBibTeX(abstract)}}
}`;

  return bibtex;
}

app.get('/api/search', (req: Request<{}, {}, {}, SearchQuery>, res: Response) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Query parameter "q" is required' });
  }

  setTimeout(() => {
    try {
      const searchTerm = q.toLowerCase();

      // Use Semantic Scholar API to search for papers
      const searchUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(searchTerm)}`
        + `&limit=10&fields=title,authors,year,venue,paperId,abstract,externalIds,url`;

      console.log(`Sending request with URL: ${searchUrl}`);

      getPapersFromDatabase().then((savedPapers: Paper[]) => {
        axios.get(searchUrl, {
          headers: {
            // 'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY
          },
          timeout: 10000,
          validateStatus: function(status) {
            return status >= 200 && status < 500;
          }
        }).then(searchResponse => {
          if (searchResponse.status === 429) {
            console.log(`Rate limited. Please wait a moment and try again.`);
            return res.status(429).json({ message: 'Too many requests. Please wait 10-30 seconds and try again.' });
          }

          if (searchResponse.status === 400) {
            console.log(`Bad Request (400). Response:`, JSON.stringify(searchResponse.data, null, 2));
            const errorMsg = searchResponse.data?.message || searchResponse.data?.error || 'Invalid search query';
            return res.status(400).json({ message: `Bad request: ${errorMsg}. Try simplifying your search query.` });
          }

          if (searchResponse.status !== 200) {
            console.log(`Search API returned status ${searchResponse.status}. Response:`, JSON.stringify(searchResponse.data, null, 2));
            return res.status(searchResponse.status).json({ message: `Search failed with status ${searchResponse.status}. ${searchResponse.data?.message || ''}` });
          }

          if (!searchResponse.data.data || searchResponse.data.data.length === 0) {
            return res.json([]);
          }

          let responsePapers = searchResponse.data.data;

          const getPaperId = (p: any): string => p.id ?? p.paperId ?? "ID_MISSING";

          const papersWithSavedStatus = responsePapers.map((paper: any) => ({
            ...paper,
            saved: savedPapers.some(saved => getPaperId(saved) === getPaperId(paper))
          }));

          res.json(
            papersWithSavedStatus.map((paper: any): Paper => ({
              id: paper.paperId,
              title: paper.title,
              authors: paper.authors.map((auth: any) => auth.name),
              abstract: paper.abstract || 'N/A',
              year: paper.year || 'N/A',
              venue: paper.venue || 'N/A',
              doi: paper.externalIds?.DOI || undefined,
              urls: {
                semanticScholar: paper.url || undefined,
                arxiv: (paper.venue === 'arXiv.org' && paper.externalIds?.DOI) ?
                  `https://doi.org/${paper.externalIds?.DOI}` : undefined
              },
              saved: paper.saved
            }))
          )
        })
      })
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }, 5000);
});

// Get a list of all saved papers
app.get('/api/papers', (_req: Request, res: Response) => {
  setTimeout(() => {
    try {
      getPapersFromDatabase().then((savedPapers: Paper[]) => {
        res.json(savedPapers);
      })
    } catch (error) {
      console.log('Error when obtaining saved papers:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }, 300);
});

// Save a new paper
app.post('/api/papers', (req: Request, res: Response) => {
  const paper = req.body as Paper;
  delete paper.saved;

  if (!paper || !paper.id) {
    return res.status(400).json({ message: 'Paper data with id is required' });
  }

  getPapersFromDatabase().then((savedPapers: Paper[]) => {
    setTimeout(() => {
      if (savedPapers.some(p => p.id === paper.id)) {
        return res.status(409).json({ message: `Paper ${paper.id} already saved` });
      }

      const paperToSave = { ...paper, files: paper.files ?? [] };
      savePapersToDatabase(
        [
          paperToSave,
          ...savedPapers
        ]
      );
      res.status(201).json({ ...paperToSave, saved: true })
    }, 400);
  })
});

// Update a paper
app.put('/api/papers/:id', (req: Request, res: Response) => {
  const paper = req.body as Paper;
  delete paper.saved;

  getPapersFromDatabase().then((savedPapers: Paper[]) => {
    setTimeout(() => {
      const idx = savedPapers.findIndex((p: Paper) => p.id === paper.id);

      if (idx === -1) {
        return res.status(404).json({ message: `No paper found with id ${paper.id}` });
      }

      savedPapers[idx] = paper;

      savePapersToDatabase(savedPapers);

      res.json({ message: `Paper ${paper.id} updated successfully` });
    }, 300);
  })
});

// Delete a saved paper
app.delete('/api/papers/:id', (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  getPapersFromDatabase().then((savedPapers: Paper[]) => {
    setTimeout(() => {
      if (!savedPapers.some((p: Paper) => p.id === id)) {
        return res.status(404).json({ message: `No paper found with id ${id}` });
      }

      savePapersToDatabase(savedPapers.filter((p: Paper) => p.id !== id));

      res.json({ message: `Paper ${id} removed successfully` });
    }, 300);
  })
});

// Generate BibTeX for specified paper
app.get('/api/papers/:id/bibtex', (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  getPapersFromDatabase().then((savedPapers: Paper[]) => {
    const matchingPapers = savedPapers.filter((p: Paper) => p.id === id);

    if (matchingPapers.length === 0) {
      return res.status(404).json({ message: `No paper found with id ${id}` });
    } else {
      const thePaper = matchingPapers[0];

      res.json({ bibtex: generateBibTeX(thePaper) })
    }
  })
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(process.env.PORT, () => {
  console.log(`Bibliography server running on http://localhost:${process.env.PORT}`);
  console.log(`Available endpoints:`);
  console.log(`   GET    /api/search?q=:query`);
  console.log(`   GET    /api/papers`);
  console.log(`   POST   /api/papers`);
  console.log(`   PUT    /api/papers/:id`);
  console.log(`   DELETE /api/papers/:id`);
  console.log(`   GET    /api/paper/:id/bibtex`)
});
