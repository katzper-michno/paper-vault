import { WebPaper } from '../types';

const LATEX_ESCAPE: [RegExp, string][] = [
  [/\\/g, '\\textbackslash{}'],
  [/&/g, '\\&'],
  [/%/g, '\\%'],
  [/\$/g, '\\$'],
  [/#/g, '\\#'],
  [/_/g, '\\_'],
  [/{/g, '\\{'],
  [/}/g, '\\}'],
  [/\^/g, '\\^{}'],
  [/~/g, '\\~{}'],
];

const escapeLatex = (str: string): string =>
  LATEX_ESCAPE.reduce((s, [re, rep]) => s.replace(re, rep), str);

const toBibTeXName = (name: string): string => {
  if (name.includes(',')) return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name;
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(' ');
  return `${last}, ${first}`;
};

const determineEntryType = (paper: WebPaper): 'article' | 'inproceedings' | 'misc' => {
  if (paper.publicationType) return paper.publicationType;
  if (paper.doi.toLowerCase().includes('arxiv')) return 'misc';
  return 'article';
};

const generateCitationKey = (paper: WebPaper): string => {
  const lastName = (paper.authors[0] ?? 'unknown')
    .trim()
    .split(/\s+/)
    .slice(-1)[0]
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  return `${lastName}${paper.year}`;
};

const extractArXivId = (doi: string): string | undefined => {
  const match = doi.toLowerCase().match(/arxiv\.(\S+)$/);
  return match ? match[1] : undefined;
};

export const generateBibTeX = (paper: WebPaper): string => {
  const entryType = determineEntryType(paper);
  const citationKey = generateCitationKey(paper);

  const authorStr = paper.authors.map(toBibTeXName).map(escapeLatex).join(' and ');

  const fields: [string, string][] = [
    ['author', authorStr],
    ['title', `{${escapeLatex(paper.title)}}`],
    ['year', String(paper.year)],
  ];

  if (entryType === 'article') {
    fields.push(['journal', escapeLatex(paper.venue)]);
    if (paper.volume) fields.push(['volume', paper.volume]);
    if (paper.issue) fields.push(['number', paper.issue]);
    if (paper.pages) fields.push(['pages', paper.pages]);
  } else if (entryType === 'inproceedings') {
    fields.push(['booktitle', escapeLatex(paper.venue)]);
    if (paper.pages) fields.push(['pages', paper.pages]);
  } else {
    const arxivId = extractArXivId(paper.doi);
    if (arxivId) {
      fields.push(['eprint', arxivId]);
      fields.push(['archivePrefix', 'arXiv']);
    }
    if (paper.venue) fields.push(['howpublished', escapeLatex(paper.venue)]);
  }

  if (paper.doi) fields.push(['doi', paper.doi]);

  const url = paper.urls.arxiv ?? paper.urls.semanticScholar ?? paper.urls.openAlex;
  if (url) fields.push(['url', url]);

  if (paper.abstract) fields.push(['abstract', escapeLatex(paper.abstract)]);

  const KEY_WIDTH = 16;
  const fieldStr = fields.map(([k, v]) => `  ${k.padEnd(KEY_WIDTH)} = {${v}}`).join(',\n');

  return `@${entryType}{${citationKey},\n${fieldStr}\n}`;
};
