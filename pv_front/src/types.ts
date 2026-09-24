export interface PaperUrls {
  openAlex?: string;
  semanticScholar?: string;
  arxiv?: string;
  sciHub?: string;
}

export interface EditFormValues {
  title: string;
  authors: string[];
  abstract: string;
  venue: string;
  year: number;
  doi: string;
  urls: PaperUrls;
  note?: string;
}

export interface WebPaper extends EditFormValues {
  id: string;
  saved: boolean;
  volume?: string;
  issue?: string;
  pages?: string;
  publicationType?: "article" | "inproceedings" | "misc";
}

export interface Paper extends WebPaper {
  files: string[];
}
