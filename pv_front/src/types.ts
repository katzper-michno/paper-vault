export interface PaperUrls {
  openAlex?: string;
  semanticScholar?: string;
  arxiv?: string;
  sciHub?: string;
}

export type PublicationType = 'article' | 'inproceedings' | 'misc';

export interface EditFormValues {
  title: string;
  authors: string[];
  abstract: string;
  venue: string;
  year: number;
  doi: string;
  urls: PaperUrls;
  volume?: string;
  issue?: string;
  pages?: string;
  publicationType?: PublicationType;
  note?: string;
}

export interface WebPaper extends EditFormValues {
  id: string;
  saved: boolean;
}

export interface Paper extends WebPaper {
  files: string[];
}
