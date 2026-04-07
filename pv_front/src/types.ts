export interface PaperUrls {
  openAlex?: string;
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
}

export interface WebPaper extends EditFormValues {
  id: string;
  saved: boolean;
}

export interface Paper extends WebPaper {
  files: string[];
}
