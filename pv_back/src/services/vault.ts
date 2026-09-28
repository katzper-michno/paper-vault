import path from "node:path";
import { Paper } from "../types.js";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";

const vaultPath = (): string => {
  const p = process.env.VAULT_PATH;
  if (!p) {
    throw Error("Vault path could not be established");
  }
  return path.join(p);
};

const vaultMetaPath = (): string => path.join(vaultPath(), "vault.json");

const vaultFilesPath = (): string => path.join(vaultPath(), "files");

const vaultMeta = (): Paper[] =>
  JSON.parse(readFileSync(vaultMetaPath(), "utf-8")) as Paper[];

const sanitizeToSave = (paper: Paper): Paper => {
  delete paper.files;
  return paper;
};

const convertDOIToId = (doi: string): string => {
  let safe = doi.trim().toLowerCase();
  safe = safe.replace("/", "__");
  safe = safe.replace(/[^\w.\-]/g, "_");
  return safe;
};

const populateWithFiles = (paper: Paper): Paper => {
  const filesDirPath = path.join(vaultPath(), "files", paper.id);
  const files = existsSync(filesDirPath) ? readdirSync(filesDirPath) : [];
  return { ...paper, files };
};

const getPapers = (): Paper[] => vaultMeta().map(populateWithFiles);

const getPaper = (id: string): Paper => {
  const paper = vaultMeta().find((p: Paper) => p.id === id);
  if (!paper) {
    throw new Error(`A paper with id ${id} not found`);
  }
  return populateWithFiles(paper);
};

const paperExists = (id: string): boolean =>
  getPapers().some((p: Paper) => p.id === id);

const savePapers = (papers: Paper[]) => {
  writeFileSync(
    vaultMetaPath(),
    JSON.stringify(papers.map(sanitizeToSave), null, 2),
  );
};

const addPaper = (paper: Paper) => {
  const papers = getPapers();
  if (papers.some((p: Paper) => p.id === paper.id)) {
    throw new Error(`A paper with id ${paper.id} already exists`);
  }
  savePapers([...papers, paper]);
};

const updatePaper = (paper: Paper) => {
  const papers = getPapers();
  const idx = papers.findIndex((p: Paper) => p.id === paper.id);
  if (idx === -1) {
    throw new Error(`Paper with id ${paper.id} not found`);
  }
  papers[idx] = paper;
  savePapers(papers);
};

const deletePaper = (id: string) => {
  const papers = getPapers();
  if (!papers.some((p: Paper) => p.id === id)) {
    throw new Error(`Paper with id ${id} not found`);
  }
  savePapers(papers.filter((p: Paper) => p.id !== id));
  rmSync(path.join(vaultFilesPath(), id), { recursive: true });
};

// Resolves a file name against a paper's files directory, rejecting any
// name that would escape it (e.g. via "../"), since it comes from client input.
const resolveFilePath = (id: string, fileName: string): string => {
  const dir = path.resolve(vaultFilesPath(), id);
  const resolved = path.resolve(dir, fileName);
  if (resolved !== dir && !resolved.startsWith(dir + path.sep)) {
    throw new Error(`Invalid file name: ${fileName}`);
  }
  return resolved;
};

const addFile = (id: string, file: Express.Multer.File): string => {
  const dest = resolveFilePath(id, file.originalname);
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, file.buffer);
  return file.originalname;
};

const deleteFile = (id: string, fileName: string) =>
  rmSync(resolveFilePath(id, fileName));

const getFilePath = (id: string, fileName: string): string => {
  const filePath = resolveFilePath(id, fileName);
  if (!existsSync(filePath)) {
    throw new Error(`File ${fileName} not found for paper ${id}`);
  }
  return filePath;
};

export const VaultService = {
  convertDOIToId,
  vaultFilesPath,
  savePapers,
  getPapers,
  getPaper,
  paperExists,
  addPaper,
  updatePaper,
  deletePaper,
  addFile,
  deleteFile,
  getFilePath,
};
