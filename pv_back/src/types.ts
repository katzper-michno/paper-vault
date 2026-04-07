export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  venue: string;
  doi?: string;
  urls: {
    openAlex?: string;
    semanticScholar?: string; // currently not used
    arxiv?: string;
    sciHub?: string;
  };
  files?: string[];
  saved?: boolean;
}
