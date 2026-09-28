import { randomUUID } from "node:crypto";
import { Request, Response } from "express";
import { Paper } from "./types.js";
import { VaultService } from "./services/vault.js";
import { BibTeXService } from "./services/bibtex.js";
import { ArXivClient } from "./services/arxiv.js";
import { SciHubClient } from "./services/sciHub.js";
import { OpenAlexClient } from "./services/openAlex.js";
import { SemanticScholarClient } from "./services/semanticScholar.js";
import { AuthService } from "./services/auth.js";
import { DownloadService } from "./services/download.js";

const healthcheck = async (_: Request, res: Response) => {
  res.status(200).json({ message: "PaperVault service is OK:)" });
};

const printUrlResolutionTable = (papers: Paper[]): void => {
  const CHECK = "✓";
  const CROSS = "✗";

  const doiWidth = Math.max(
    "DOI".length,
    ...papers.map((p) => p.doi?.length ?? 0),
  );

  const divider = `+${"-".repeat(doiWidth + 2)}+--------+----------+`;
  const header = `| ${"DOI".padEnd(doiWidth)} | arXiv  | Sci-Hub  |`;

  console.log(divider);
  console.log(header);
  console.log(divider);

  for (const paper of papers) {
    const arxivCell = (paper.urls.arxiv ? CHECK : CROSS).padStart(3).padEnd(6);
    const sciHubCell = (paper.urls.sciHub ? CHECK : CROSS)
      .padStart(4)
      .padEnd(8);
    console.log(
      `| ${(paper.doi ?? "").padEnd(doiWidth)} | ${arxivCell} | ${sciHubCell} |`,
    );
  }

  console.log(divider);
};

// Sometimes, we are able to deduce some information in a non-direct way
const extrapolateMoreData = (paper: Paper) => {
  let venue = paper.venue;

  if (
    Boolean(paper.venue) === false &&
    paper.doi.toLowerCase().includes("arxiv")
  ) {
    venue = "arXiv";
  }

  return {
    ...paper,
    venue,
  };
};

const mergeEnhanceAndFilterResults = (oa: Paper[], ss: Paper[]) => {
  // Semantic Scholar results usually contain more information, so we remove duplicates prioritizing them
  const ssWithOALinks: Paper[] = ss.map((paper: Paper) => {
    const oaEntry = oa.find((other: Paper) => other.doi === paper.doi);
    return oaEntry
      ? {
          ...paper,
          abstract: Boolean(paper.abstract) ? paper.abstract : oaEntry.abstract, // For some reason, sometimes SS returns no abstract
          volume: paper.volume ?? oaEntry.volume,
          issue: paper.issue ?? oaEntry.issue,
          pages: paper.pages ?? oaEntry.pages,
          publicationType: paper.publicationType ?? oaEntry.publicationType,
          urls: {
            ...paper.urls,
            openAlex: oaEntry.urls.openAlex,
          },
        }
      : paper;
  });

  const oaWithoutDuplicates = oa.filter(
    (paper: Paper) => !ss.some((other: Paper) => other.doi == paper.doi),
  );

  const isNotGarbage = (_: Paper) => {
    // TODO: What is garbage?
    return true;
  };

  // Interleaving to avoid pushing only one source to the top
  return interleaveResults(ssWithOALinks, oaWithoutDuplicates)
    .map(extrapolateMoreData)
    .filter(isNotGarbage);
};

const interleaveResults = (oa: Paper[], ss: Paper[]) =>
  Array.from({ length: Math.max(oa.length, ss.length) })
    .flatMap((_, i) => [oa[i], ss[i]])
    .filter((x) => x !== undefined);

interface SearchResponse {
  results: Paper[];
  hasMore: boolean;
}

const search = async (
  req: Request<{}, {}, {}, { q: string; page?: string }>,
  res: Response<SearchResponse | { message: string }>,
) => {
  const { q, page: rawPage } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Query parameter "q" is required' });
  }

  const searchQuery = q.trim().toLowerCase();
  const page = Math.max(1, Number(rawPage) || 1);
  const offset = (page - 1) * 10;

  let openAlexResults: Paper[] = [];
  try {
    openAlexResults = await OpenAlexClient.searchPapers(searchQuery, page);
  } catch (error: any) {
    console.log(
      "[Controller] Error when searching for papers on OpenAlex:",
      error,
    );
  }

  let semanticScholarResults: Paper[] = [];
  try {
    semanticScholarResults = await SemanticScholarClient.searchPapers(
      searchQuery,
      offset,
    );
  } catch (error: any) {
    console.log(
      "[Controller] Error when searching for papers on semantic scholar:",
      error,
    );
  }

  const hasMore = openAlexResults.length > 0 || semanticScholarResults.length > 0;

  const searchResults = mergeEnhanceAndFilterResults(
    openAlexResults,
    semanticScholarResults,
  );

  try {
    const resultsWithLinks = await Promise.all(
      searchResults.map(async (paper: Paper) => ({
        ...paper,
        urls: {
          ...paper.urls,
          arxiv: ArXivClient.generateLink(paper),
          sciHub: await SciHubClient.generateLink(paper),
        },
      })),
    );

    console.log("[Controller] Resolved urls:");
    printUrlResolutionTable(resultsWithLinks);

    res.status(200).json({ results: resultsWithLinks, hasMore });
  } catch (error: any) {
    console.log("[Controller] Error when searching for papers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const normalizeDoiInput = (input: string): string => {
  let doi = input.trim().toLowerCase();

  if (doi.startsWith("https://doi.org/")) {
    doi = doi.slice("https://doi.org/".length);
  }

  const arxivId = ArXivClient.extractArxivId(doi);
  if (arxivId && !doi.startsWith("10.")) {
    doi = `10.48550/arxiv.${arxivId}`;
  }

  return doi;
};

const lookupByDoi = async (
  req: Request<{}, {}, {}, { doi: string }>,
  res: Response<Paper | { message: string }>,
) => {
  const { doi: rawDoi } = req.query;

  if (!rawDoi) {
    return res.status(400).json({ message: 'Query parameter "doi" is required' });
  }

  const doi = normalizeDoiInput(rawDoi);

  let openAlexResult: Paper | undefined;
  try {
    openAlexResult = await OpenAlexClient.getPaperByDoi(doi);
  } catch (error: any) {
    console.log(
      "[Controller] Error when looking up paper on OpenAlex:",
      error,
    );
  }

  let semanticScholarResult: Paper | undefined;
  try {
    semanticScholarResult = await SemanticScholarClient.getPaperByDoi(doi);
  } catch (error: any) {
    console.log(
      "[Controller] Error when looking up paper on semantic scholar:",
      error,
    );
  }

  const [paper] = mergeEnhanceAndFilterResults(
    openAlexResult ? [openAlexResult] : [],
    semanticScholarResult ? [semanticScholarResult] : [],
  );

  if (!paper) {
    return res
      .status(404)
      .json({ message: `No paper found for DOI "${rawDoi}"` });
  }

  try {
    const paperWithLinks: Paper = {
      ...paper,
      urls: {
        ...paper.urls,
        arxiv: ArXivClient.generateLink(paper),
        sciHub: await SciHubClient.generateLink(paper),
      },
    };

    res.status(200).json(paperWithLinks);
  } catch (error: any) {
    console.log("[Controller] Error when resolving urls for paper:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const sanitizeForReadOnly = (paper: Paper): Paper => {
  const sanitized = { ...paper };
  if (!AuthService.allowNotesInReadOnly()) delete sanitized.note;
  if (!AuthService.allowFilesInReadOnly()) sanitized.files = [];
  return sanitized;
};

const getPapers = async (
  req: Request,
  res: Response<Paper[] | { message: string }>,
) => {
  try {
    const papers = VaultService.getPapers();
    const visiblePapers = AuthService.isAuthenticated(req)
      ? papers
      : papers.map(sanitizeForReadOnly);

    res.status(200).json(visiblePapers);
  } catch (error: any) {
    console.log("[Controller] Error when obtaining saved papers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addPaper = async (
  req: Request,
  res: Response<Paper | { message: string }>,
) => {
  const paper = req.body as Paper;

  if (!paper) {
    return res.status(400).json({ message: "Paper data is required" });
  }

  if (!paper.id) {
    paper.id = paper.doi
      ? VaultService.convertDOIToId(paper.doi)
      : randomUUID();
  }

  if (VaultService.paperExists(paper.id)) {
    return res
      .status(400)
      .json({ message: `Paper with id ${paper.id} already exists` });
  }

  try {
    VaultService.addPaper(paper);

    // Each source is downloaded independently, so one failing (e.g. a dead
    // link) doesn't prevent the others from being attached.
    if (paper.urls.arxiv) {
      try {
        const arxivPdf = await ArXivClient.downloadPdf(paper.doi);
        VaultService.addFile(paper.id, arxivPdf);
      } catch (error: any) {
        console.warn("[Controller] Error downloading arXiv pdf:", error);
      }
    }
    if (paper.urls.sciHub) {
      try {
        const sciHubPdf = await SciHubClient.downloadPdf(paper.doi);
        VaultService.addFile(paper.id, sciHubPdf);
      } catch (error: any) {
        console.warn("[Controller] Error downloading Sci-Hub pdf:", error);
      }
    }
    if (paper.urls.openAccessPdf) {
      try {
        const openAccessPdf = await DownloadService.downloadAsFile(
          paper.urls.openAccessPdf,
          `open_access_${paper.id}.pdf`,
        );
        VaultService.addFile(paper.id, openAccessPdf);
      } catch (error: any) {
        console.warn("[Controller] Error downloading open-access pdf:", error);
      }
    }

    res.status(201).json(VaultService.getPaper(paper.id));
  } catch (error: any) {
    console.log("[Controller] Error when adding new paper:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updatePaper = async (
  req: Request,
  res: Response<Paper | { message: string }>,
) => {
  const paper = req.body as Paper;

  if (!VaultService.paperExists(paper.id)) {
    return res
      .status(404)
      .json({ message: `Paper with id ${paper.id} not found` });
  }

  try {
    VaultService.updatePaper(paper);
    res.status(200).json(VaultService.getPaper(paper.id));
  } catch (error: any) {
    console.log("[Controller] Error when updating paper:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deletePaper = async (
  req: Request<{ id: string }>,
  res: Response<{ message: string }>,
) => {
  const { id } = req.params;

  if (!VaultService.paperExists(id)) {
    return res.status(404).json({ message: `Paper with id ${id} not found` });
  }

  try {
    VaultService.deletePaper(id);
    res.status(204).json({ message: `Paper ${id} deleted successfuly` });
  } catch (error: any) {
    console.log("[Controller] Error when removing paper:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const generateBibTeX = async (
  req: Request<{ id: string }>,
  res: Response<{ bibtex: string } | { message: string }>,
) => {
  const { id } = req.params;

  if (!VaultService.paperExists(id)) {
    return res.status(404).json({ message: `Paper with id ${id} not found` });
  }

  try {
    res
      .status(200)
      .json({ bibtex: BibTeXService.generate(VaultService.getPaper(id)) });
  } catch (error: any) {
    console.log("[Controller] Error when generating BibTeX:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

interface UploadFileRequest extends Request<{ id: string }> {
  file?: Express.Multer.File;
}

const addFile = async (
  req: UploadFileRequest,
  res: Response<{ name: string } | { message: string }>,
) => {
  const { id } = req.params;
  const file = req.file;

  if (!VaultService.paperExists(id)) {
    return res.status(404).json({ message: `Paper with id ${id} not found` });
  }

  if (!file) {
    return res.status(400).json({ message: "No file to add" });
  }

  try {
    res.status(200).json({ name: VaultService.addFile(id, file) });
  } catch (error: any) {
    console.log("[Controller] Error when adding new file:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteFile = async (
  req: Request<{ id: string; name: string }>,
  res: Response<{ message: string }>,
) => {
  const { id, name } = req.params;
  const decodedName = decodeURIComponent(name);

  if (!VaultService.paperExists(id)) {
    return res.status(404).json({ message: `Paper with id ${id} not found` });
  }

  try {
    VaultService.deleteFile(id, decodedName);
    res.status(204).json({
      message: `File ${name} attached to paper ${id} deleted successfuly`,
    });
  } catch (error: any) {
    console.log("[Controller] Error when removing file:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const openFile = async (
  req: Request<{ id: string; name: string }>,
  res: Response,
) => {
  const { id, name } = req.params;
  const decodedName = decodeURIComponent(name);

  if (!VaultService.paperExists(id)) {
    return res.status(404).json({ message: `Paper with id ${id} not found` });
  }

  if (!AuthService.isAuthenticated(req) && !AuthService.allowFilesInReadOnly()) {
    return res.status(401).json({
      message: "This vault is read-only. Unlock full access to view attached files.",
    });
  }

  try {
    const filePath = VaultService.getFilePath(id, decodedName);
    res.sendFile(filePath);
  } catch (error: any) {
    console.log("[Controller] Error when opening file:", error);
    res.status(404).json({ message: `File ${name} not found` });
  }
};

export const Controller = {
  healthcheck,
  search,
  lookupByDoi,
  getPapers,
  addPaper,
  updatePaper,
  deletePaper,
  generateBibTeX,
  addFile,
  deleteFile,
  openFile,
};
