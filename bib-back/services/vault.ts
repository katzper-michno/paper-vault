import path from "node:path";
import { Paper } from "../types";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const vault_path = (): string => {
  const p = process.env.DB_PATH;
  if (!p) {
    throw Error("Vault path could not be established");
  }
  return path.join(p, 'db.json');
}

const vault = (): Paper[] =>
  JSON.parse(readFileSync(vault_path(), "utf-8")) as Paper[];

const sanitizeToSave = (paper: Paper): Paper => {
  delete paper.saved;
  delete paper.files;
  return paper;
}

const populateWithFiles = (paper: Paper): Paper => {
  const filesDirPath = path.join(vault_path(), 'files', paper.id);
  const files = (existsSync(filesDirPath)) ? readdirSync(filesDirPath) : [];
  return { ...paper, files };
}

const getPapers = (): Paper[] => vault().map(populateWithFiles);

const getPaper = (id: string): Paper => {
  const paper = vault().find((p: Paper) => p.id === id);
  if (!paper) {
    throw new Error(`A paper with id ${id} not found`);
  }
  return populateWithFiles(paper);
}

const savePapersToDatabase = (papers: Paper[]) => {
  writeFileSync(vault_path(), JSON.stringify(papers.map(sanitizeToSave), null, 2));
}

const addPaper = (paper: Paper) => {
  const papers = getPapers();
  if (papers.some((p: Paper) => p.id === paper.id)) {
    throw new Error(`A paper with id ${paper.id} already exists`);
  }
  savePapersToDatabase([...papers, paper]);
}

const updatePaper = (paper: Paper) => {
  const papers = getPapers();
  const idx = papers.findIndex((p: Paper) => p.id === paper.id);
  if (idx === -1) {
    throw new Error(`Paper with id ${paper.id} not found`);
  }
  papers[idx] = paper;
  savePapersToDatabase(papers);
}

const removePaper = (id: string) => {
  const papers = getPapers();
  if (!papers.some((p: Paper) => p.id === id)) {
    throw new Error(`Paper with id ${id} not found`);
  }
  savePapersToDatabase(papers.filter((p: Paper) => p.id !== id));
}

export const VaultService = {
  getPapers,
  getPaper,
  addPaper,
  updatePaper,
  removePaper
}
