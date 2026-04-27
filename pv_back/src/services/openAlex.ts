import { Paper } from "../types.js";
import axios from "axios";
import { VaultService } from "./vault.js";

interface OpenAlexWork {
  id: string;
  title: string;
  authorships: { author: { display_name: string } }[];
  abstract_inverted_index: Record<string, number[]> | null;
  publication_year: number;
  primary_location?: {
    source?: {
      display_name?: string;
    };
    raw_source_name?: string;
  };
  doi?: string;
}

interface OpenAlexResponse {
  meta: {
    count: number;
  };
  results: OpenAlexWork[];
}

function reconstructAbstract(
  invertedIndex: Record<string, number[]> | null,
): string {
  if (!invertedIndex) return "";

  const words: string[] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words[pos] = word;
    }
  }

  return words.filter(Boolean).join(" ");
}

export async function searchPapers(query: string): Promise<Paper[]> {
  const API_KEY = process.env.OPEN_ALEX_API_KEY;

  const url =
    "https://api.openalex.org/works?" +
    `search=${encodeURIComponent(query)}` +
    "&per-page=10" +
    "&include_xpac=true" +
    (API_KEY ? `&api_key=${API_KEY}` : "");

  console.log(`[OpenAlexClient] Sending request with URL: ${url}`);

  const response = await axios.get<OpenAlexResponse>(url, {
    timeout: 20000,
  });

  console.log(`[OpenAlexClient] Obtained ${response.data.meta.count} results`);

  return response.data.results
    .filter((work: OpenAlexWork) => Boolean(work.doi))
    .map((work: OpenAlexWork) => {
      const venue =
        work.primary_location?.source?.display_name ??
        work.primary_location?.raw_source_name ??
        "";

      const doi: string = (
        work.doi!.startsWith("https://doi.org/")
          ? work.doi!.slice("https://doi.org/".length)
          : work.doi!
      ).toLowerCase();

      return {
        id: VaultService.convertDOIToId(doi),
        title: work.title,
        authors: work.authorships.map((a) => a.author.display_name),
        abstract: reconstructAbstract(work.abstract_inverted_index),
        year: work.publication_year,
        venue: venue,
        doi: doi,
        urls: {
          openAlex: work.id,
        },
      };
    });
}

export const OpenAlexClient = {
  searchPapers,
};
