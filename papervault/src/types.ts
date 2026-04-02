export interface EditFormValues {
  title: string;
  authors: string[];
  abstract: string;
  venue: string;
  year: number;
  doi: string;
  urls: {
    semanticScholar: string | null;
    arxiv: string | null;
  }
}

export interface WebPaper extends EditFormValues {
  id: string;
  saved: boolean;
}

export interface AttachedFile {
  name: string;
}

export interface Paper extends WebPaper {
  files: AttachedFile[];
}