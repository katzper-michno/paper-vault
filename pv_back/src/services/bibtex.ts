import { Paper } from "../types";

// Function to escape BibTeX special characters
const escapeBibTeX = (str: string): string => {
  return str
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\^/g, "\\^{}")
    .replace(/~/g, "\\~{}");
};

// Function to generate BibTeX entry
const generate = (paper: Paper): string => {
  const { title, authors, abstract, year, venue } = paper;

  // Format authors: "Last, First and Last, First"
  const formattedAuthors = authors.join(" and ");

  // Generate a citation key: first author's last name + year
  const citationKey = `${authors[0].split(" ").slice(-1)[0].toLowerCase()}${year}`;

  // Construct BibTeX string
  const bibtex = `@article{${citationKey},
  author = {${escapeBibTeX(formattedAuthors)}},
  title  = {${escapeBibTeX(title)}},
  journal = {${escapeBibTeX(venue)}},
  year   = {${year}},
  abstract = {${escapeBibTeX(abstract)}}
}`;

  return bibtex;
};

export const BibTeXService = {
  generate,
};
