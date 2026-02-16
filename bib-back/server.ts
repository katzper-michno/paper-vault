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
  doi: string;
  url: string;
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

      getPapersFromDatabase().then((savedPapers: Paper[]) => {
        axios.get(searchUrl, {
          headers: {
            'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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

          // TODO: Some type for the Semantic Scholar response
          res.json(
            papersWithSavedStatus.map((paper: any) => ({
              id: paper.paperId,
              title: paper.title,
              authors: paper.authors.map((auth: any) => auth.name),
              abstract: paper.abstract || 'N/A',
              year: paper.year || 'N/A',
              venue: paper.venue || 'N/A',
              doi: paper.externalIds?.DOI || 'N/A',
              url: paper.url || 'N/A',
              saved: paper.saved
            }))
          )
        })
      })
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }, 500);
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
        return res.status(409).json({ message: 'Paper already saved' });
      }

      savePapersToDatabase([paper, ...savedPapers]);
      res.status(201).json({ ...paper, saved: true })
    }, 400);
  })
});

// Delete a saved paper
app.delete('/api/papers/:id', (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  getPapersFromDatabase().then((savedPapers: Paper[]) => {
    setTimeout(() => {
      if (!savedPapers.some((p: Paper) => p.id === id)) {
        return res.status(404).json({ message: 'Paper not found in database' });
      }

      savePapersToDatabase(savedPapers.filter((p: Paper) => p.id !== id));

      res.json({ message: 'Paper removed successfully' });
    }, 300);
  })
});

// Get a specific paper
// app.get('/api/papers/:id', (req: Request<{ id: string }>, res: Response) => {
//   const { id } = req.params;
//
//   setTimeout(() => {
//     const paper = mockPapers.find(p => p.id === id) ||
//       savedPapers.find(p => p.id === id);
//
//     if (!paper) {
//       return res.status(404).json({ error: 'Paper not found' });
//     }
//
//     const isSaved = savedPapers.some(p => p.id === id);
//     const savedPaper = savedPapers.find(p => p.id === id);
//
//     res.json({
//       ...paper,
//       saved: isSaved,
//       savedDate: savedPaper?.savedDate
//     });
//   }, 200);
// });

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
  console.log(`   GET  /api/search?q=:query`);
  console.log(`   GET  /api/papers`);
  console.log(`   POST /api/papers`);
  // console.log(`   GET  /api/papers/:id`);
  console.log(`   DELETE /api/papers/:id`);
});
