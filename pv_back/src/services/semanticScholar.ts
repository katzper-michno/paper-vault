import axios, { AxiosResponse } from "axios";
import { Paper } from "../types.js";
import { VaultService } from "./vault.js";

interface SemanticScholarAuthor {
  name: string;
}

interface SemanticScholarWork {
  title: string;
  authors: SemanticScholarAuthor[];
  year: number;
  venue?: string;
  abstract: string;
  externalIds?: {
    DOI?: string;
    ArXiv?: string;
  };
  url: string;
  openAccessPdf?: {
    url?: string;
  };
}

interface SemanticScholarResponse {
  total: number;
  offset: number;
  next: number;
  data: SemanticScholarWork[];
}

export class SemanticScholarError extends Error {
  constructor(
    public status: number,
    public message: string,
  ) {
    super(message);
  }
}

const searchPapers = async (query: string): Promise<Paper[]> => {
  const API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY;

  const searchTerm = query.toLowerCase();

  // Use Semantic Scholar API to search for papers
  const searchUrl =
    "https://api.semanticscholar.org/graph/v1/paper/search" +
    `?query=${encodeURIComponent(searchTerm)}` +
    "&limit=10" +
    "&fields=title,authors,year,venue,abstract,externalIds,url,openAccessPdf";

  const headers = API_KEY ? { "x-api-key": API_KEY } : {};

  console.log(
    `[SemanticScholarClient] Sending request with URL: ${searchUrl}, and headers: ${JSON.stringify(headers)}`,
  );

  const response = await axios.get<SemanticScholarResponse>(searchUrl, {
    headers,
    timeout: 10000,
    validateStatus: function (status) {
      return status >= 200 && status < 500;
    },
  });

  if (response.status != 200) {
    throw throwProperError(response);
  }

  console.log(`[OpenAlexClient] Obtained ${response.data.total} results`);

  if (!response.data.data || response.data.data.length === 0) {
    return [];
  }

  return response.data.data
    .filter(
      (work: SemanticScholarWork) =>
        Boolean(work.externalIds?.DOI) || Boolean(work.externalIds?.ArXiv),
    )
    .map((work: SemanticScholarWork): Paper => {
      let doi = work.externalIds?.DOI?.startsWith("https://doi.org/")
        ? work.externalIds?.DOI?.slice("https://doi.org/".length)
        : work.externalIds?.DOI;

      if (doi == undefined && Boolean(work.externalIds?.ArXiv)) {
        doi = "10.48550/arxiv." + work.externalIds!.ArXiv!;
      }

      doi = doi!.toLowerCase();

      return {
        id: VaultService.convertDOIToId(doi!),
        title: work.title,
        authors: work.authors.map((auth: any) => auth.name),
        abstract: work.abstract || "",
        year: work.year,
        venue: work.venue || "",
        doi: doi!,
        urls: {
          semanticScholar: work.url,
        },
      };
    });
};

const throwProperError = (response: AxiosResponse) => {
  if (response.status === 429) {
    console.log(
      `[SemanticScholarClient] Rate limited. Please wait a moment and try again.`,
    );
    throw new SemanticScholarError(
      429,
      "Too many requests. Please wait 10-30 seconds and try again.",
    );
  } else if (response.status === 400) {
    console.log(
      `[SemanticScholarClient] Bad Request (400). Response:`,
      JSON.stringify(response.data, null, 2),
    );
    const errorMsg =
      response.data?.message || response.data?.error || "Invalid search query";
    throw new SemanticScholarError(
      400,
      `Bad request: ${errorMsg}. Try simplifying your search query.`,
    );
  } else if (response.status !== 200) {
    console.log(
      `[SemanticScholarClient] Search API returned status ${response.status}. Response:`,
      JSON.stringify(response.data, null, 2),
    );
    throw new SemanticScholarError(
      response.status,
      `Search failed with status ${response.status}. ${response.data?.message || ""}`,
    );
  }
};

export const SemanticScholarClient = {
  searchPapers,
};
