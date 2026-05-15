import { Paper } from "../types.js";
import { DownloadService } from "./download.js";
import { Readable } from "node:stream";

const generateLink = (paper: Paper): string | undefined =>
  paper.doi.toLowerCase().includes("arxiv")
    ? `https://doi.org/${paper.doi}`
    : undefined;

/**
 * Downloads an arXiv PDF given a DOI, arXiv ID, or arXiv URL.
 *
 * Accepts:
 *   - Full DOI:     "10.48550/arXiv.2301.07041"
 *   - arXiv ID:     "2301.07041" or "2301.07041v2"
 *   - arXiv URL:    "https://arxiv.org/abs/2301.07041"
 *
 * @param doi - The DOI, arXiv ID, or arXiv URL
 * @returns Resolves with the saved file
 */
export async function downloadPdf(doi: string): Promise<Express.Multer.File> {
  const arxivId = extractArxivId(doi);
  if (!arxivId) {
    throw new Error(`Could not extract arXiv ID from: "${doi}"`);
  }

  const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
  const fileName = `arxiv_${arxivId.replace("/", "_")}.pdf`;

  console.log(`Downloading arXiv file: ${pdfUrl}`);

  const buffer = await DownloadService.downloadToBuffer(pdfUrl);

  return {
    fieldname: "file",
    originalname: fileName,
    encoding: "7bit",
    mimetype: "application/pdf",
    buffer,
    size: buffer.length,
    // Readable stream from the buffer, in case downstream needs it
    stream: Readable.from(buffer),
    destination: "",
    filename: fileName,
    path: "",
  };
}

/**
 * Extracts the arXiv ID from various input formats.
 *
 * @example
 * extractArxivId("10.48550/arXiv.2301.07041") // → "2301.07041"
 * extractArxivId("https://arxiv.org/abs/2301.07041") // → "2301.07041"
 * extractArxivId("2301.07041v2") // → "2301.07041v2"
 */
function extractArxivId(input: string): string | null {
  const trimmed = input.trim();

  // Format: "10.48550/arXiv.2301.07041"
  const doiMatch = trimmed.match(/arxiv\.(\d{4}\.\d{4,5}(?:v\d+)?)/i);
  if (doiMatch?.[1]) return doiMatch[1];

  // Format: "https://arxiv.org/abs/2301.07041" or ".../pdf/2301.07041"
  const urlMatch = trimmed.match(
    /arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?)/i,
  );
  if (urlMatch?.[1]) return urlMatch[1];

  // Format: bare ID "2301.07041" or "2301.07041v2"
  const bareMatch = trimmed.match(/^(\d{4}\.\d{4,5}(?:v\d+)?)$/);
  if (bareMatch?.[1]) return bareMatch[1];

  return null;
}

export const ArXivClient = {
  generateLink,
  downloadPdf,
};
