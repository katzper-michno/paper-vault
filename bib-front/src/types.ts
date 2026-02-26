export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  venue: string;
  doi: string;
  url: string;
  saved: boolean;
}
