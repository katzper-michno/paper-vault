import axios from "axios";
import { Paper } from "../types"
import { VaultService } from './vault';

export class SemanticScholarError extends Error {
  constructor(public status: number, public message: string) {
    super(message);
  }
}

const searchPapers = async (query: string): Promise<Paper[]> => {
  const searchTerm = query.toLowerCase();

  // Use Semantic Scholar API to search for papers
  const searchUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(searchTerm)}`
    + `&limit=10&fields=title,authors,year,venue,paperId,abstract,externalIds,url`;

  console.log(`[SemanticScholarClient] Sending request with URL: ${searchUrl}`);

  const savedPapers = VaultService.getPapers();

  const searchResponse = await axios.get(searchUrl, {
    headers: {
      // 'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY
    },
    timeout: 10000,
    validateStatus: function(status) {
      return status >= 200 && status < 500;
    }
  })

  if (searchResponse.status === 429) {
    console.log(`[SemanticScholarClient] Rate limited. Please wait a moment and try again.`);
    throw new SemanticScholarError(
      429,
      'Too many requests. Please wait 10-30 seconds and try again.'
    );
  } else if (searchResponse.status === 400) {
    console.log(`[SemanticScholarClient] Bad Request (400). Response:`, JSON.stringify(searchResponse.data, null, 2));
    const errorMsg = searchResponse.data?.message || searchResponse.data?.error || 'Invalid search query';
    throw new SemanticScholarError(
      400,
      `Bad request: ${errorMsg}. Try simplifying your search query.`
    );
  } else if (searchResponse.status !== 200) {
    console.log(`[SemanticScholarClient] Search API returned status ${searchResponse.status}. Response:`, JSON.stringify(searchResponse.data, null, 2));
    throw new SemanticScholarError(
      searchResponse.status,
      `Search failed with status ${searchResponse.status}. ${searchResponse.data?.message || ''}`
    );
  }

  if (!searchResponse.data.data || searchResponse.data.data.length === 0) {
    return [];
  }

  let responsePapers = searchResponse.data.data;

  const getPaperId = (p: any): string => p.id ?? p.paperId ?? "ID_MISSING";

  const papersWithSavedStatus = responsePapers.map((paper: any) => ({
    ...paper,
    saved: savedPapers.some(saved => getPaperId(saved) === getPaperId(paper))
  }));

  return papersWithSavedStatus.map((paper: any): Paper => ({
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
}


export const SemanticScholarClient = {
  searchPapers
}
