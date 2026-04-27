import { Paper } from "../types";

const generateLink = (paper: Paper): string | undefined =>
  paper.doi.toLowerCase().includes("arxiv")
    ? `https://doi.org/${paper.doi}`
    : undefined;

export const ArXivClient = {
  generateLink,
};
