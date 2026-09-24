export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  venue: string;
  urls: {
    openAlex?: string;
    semanticScholar?: string;
    arxiv?: string;
    sciHub?: string;
  };
  doi: string;
  files?: string[];
  volume?: string;
  issue?: string;
  pages?: string;
  publicationType?: "article" | "inproceedings" | "misc";
}
