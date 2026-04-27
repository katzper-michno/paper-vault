import { Request, Response } from "express";
import { Paper } from "./types";
import { VaultService } from "./services/vault";
import { BibTeXService } from "./services/bibtex";
import { ArXivClient } from "./services/arxiv";
import { SciHubClient } from "./services/sciHub";
import { OpenAlexClient } from "./services/openAlex";
import { SemanticScholarClient } from "./services/semanticScholar";

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
  let venue = paper.venue

  if (Boolean(paper.venue) === false && paper.doi.toLowerCase().includes('arxiv')) {
    venue = 'arXiv'
  }

  return {
    ...paper,
    venue
  }
}

const mergeEnhanceAndFilterResults = (oa: Paper[], ss: Paper[]) => {
  // Semantic Scholar results usually contain more information, so we remove duplicates prioritizing them
  const ssWithOALinks: Paper[] = ss.map((paper: Paper) => {
    const oaEntry = oa.find((other: Paper) => other.doi === paper.doi)
    return oaEntry ? {
      ...paper,
      abstract: Boolean(paper.abstract) ? paper.abstract : oaEntry.abstract, // For some reason, sometimes SS returns no abstract
      urls: {
        ...paper.urls,
        openAlex: oaEntry.urls.openAlex
      },
    } : paper
  })

  const oaWithoutDuplicates = oa.filter((paper: Paper) => !ss.some((other: Paper) => other.doi == paper.doi))

  const isNotGarbage = (_: Paper) => {
    // TODO: What is garbage?
    return true;
  }

  // Interleaving to avoid pushing only one source to the top
  return interleaveResults(ssWithOALinks, oaWithoutDuplicates)
    .map(extrapolateMoreData)
    .filter(isNotGarbage)
}

const interleaveResults = (oa: Paper[], ss: Paper[]) =>
  Array.from({ length: Math.max(oa.length, ss.length) })
    .flatMap((_, i) => [oa[i], ss[i]])
    .filter((x) => x !== undefined);

const search = async (
  req: Request<{}, {}, {}, { q: string }>,
  res: Response<Paper[] | { message: string }>,
) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Query parameter "q" is required' });
  }

  const searchQuery = q.trim().toLowerCase()

  const openAlexResults = await OpenAlexClient.searchPapers(searchQuery)
  let semanticScholarResults: Paper[] = []
  try {
    semanticScholarResults = await SemanticScholarClient.searchPapers(searchQuery)
  } catch (error: any) {
    console.log("[Controller] Error when searching for papers on semantic scholar:", error)
  }

  const searchResults = mergeEnhanceAndFilterResults(openAlexResults, semanticScholarResults)

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

    res.status(200).json(resultsWithLinks);
  } catch (error: any) {
    console.log("[Controller] Error when searching for papers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getPapers = async (
  _: Request,
  res: Response<Paper[] | { message: string }>,
) => {
  try {
    res.status(200).json(VaultService.getPapers());
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

  if (!paper || !paper.id) {
    return res.status(400).json({ message: "Paper data with id is required" });
  }

  if (VaultService.paperExists(paper.id)) {
    return res
      .status(400)
      .json({ message: `Paper with id ${paper.id} already exists` });
  }

  try {
    VaultService.addPaper(paper);
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

const openFilesDir = async (
  req: Request<{ id: string }>,
  res: Response<{ message: string }>,
) => {
  const { id } = req.params;

  if (!VaultService.paperExists(id)) {
    return res.status(404).json({ message: `Paper with id ${id} not found` });
  }

  try {
    VaultService.openFilesDir(id);
    res.status(200).json({
      message: `Directory of files attached to ${id} opened successfuly`,
    });
  } catch (error: any) {
    console.log("[Controller] Error when opening files directory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const openFile = async (
  req: Request<{ id: string; name: string }>,
  res: Response<{ message: string }>,
) => {
  const { id, name } = req.params;
  const decodedName = decodeURIComponent(name);

  if (!VaultService.paperExists(id)) {
    return res.status(404).json({ message: `Paper with id ${id} not found` });
  }

  try {
    VaultService.openFile(id, decodedName);
    res.status(200).json({
      message: `File ${name} attached to paper ${id} opened successfuly`,
    });
  } catch (error: any) {
    console.log("[Controller] Error when opening file:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const Controller = {
  healthcheck,
  search,
  getPapers,
  addPaper,
  updatePaper,
  deletePaper,
  generateBibTeX,
  addFile,
  deleteFile,
  openFilesDir,
  openFile,
};
