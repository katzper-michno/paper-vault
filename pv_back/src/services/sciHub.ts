import axios from "axios";
import { Paper } from "../types.js";
import { DownloadService } from "./download.js";
import { Readable } from "node:stream";

// Sci-Hub mirrors to try in order
const SCIHUB_MIRRORS = [
  "https://sci-hub.pl",
  // "https://sci-hub.se",
  // "https://sci-hub.st",
  // "https://sci-hub.ru",
];

const generateLink = async (paper: Paper): Promise<string | undefined> => {
  if (!paper.doi) return undefined;

  for (const mirror of SCIHUB_MIRRORS) {
    const shUrl = `${mirror}/${paper.doi}`;

    try {
      const res = await axios(shUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const rawData = res.data as string;
      if (rawData.includes("application/pdf")) {
        return shUrl;
      }
    } catch (err: any) {
      // Trying next mirror.
    }
  }

  return undefined;
};

/**
 * Downloads a Sci-Hub PDF for a given DOI.
 *
 * @param doi - e.g. "10.1038/nature12373"
 */
export async function downloadPdf(doi: string): Promise<Express.Multer.File> {
  let lastError: Error = new Error("No mirrors available");

  for (const mirror of SCIHUB_MIRRORS) {
    try {
      const pageUrl = `${mirror}/${doi}`;

      console.log(`Trying mirror: ${pageUrl}`);
      const html = await DownloadService.fetchHtml(pageUrl);
      const pdfUrl = extractPdfUrl(html, mirror);

      if (!pdfUrl) {
        throw new Error(`No PDF URL found in Sci-Hub page at ${pageUrl}`);
      }

      console.log(`Found PDF URL: ${pdfUrl}`);
      console.log(`Downloading Sci-Hub file: ${pdfUrl}`);

      const buffer = await DownloadService.downloadToBuffer(pdfUrl);
      const fileName = "sci_hub_" + doi.replace(/[/\\?%*:|"<>]/g, "_") + ".pdf";

      return {
        fieldname: "file",
        originalname: fileName,
        encoding: "7bit",
        mimetype: "application/pdf",
        buffer,
        size: buffer.length,
        stream: Readable.from(buffer),
        destination: "",
        filename: fileName,
        path: "",
      };
    } catch (err) {
      console.warn(`Mirror ${mirror} failed: ${(err as Error).message}`);
      lastError = err as Error;
    }
  }

  throw new Error(
    `All Sci-Hub mirrors failed. Last error: ${lastError.message}`,
  );
}

/**
 * Extracts the PDF URL from a Sci-Hub HTML page.
 * Handles the various embed/iframe/button patterns Sci-Hub uses.
 */
function extractPdfUrl(html: string, mirror: string): string | null {
  // Pattern 1: <iframe src="...pdf..."> or <embed src="...pdf...">
  const embedMatch = html.match(
    /<(?:iframe|embed)[^>]+src\s*=\s*["']([^"']+\.pdf[^"']*)["']/i,
  );
  if (embedMatch?.[1]) return resolveUrl(embedMatch[1], mirror);

  // Pattern 2: onclick="location.href='...'" on the download button
  const onclickMatch = html.match(
    /onclick\s*=\s*["']location\.href\s*=\s*['"]([^'"]+\.pdf[^'"]*)["']/i,
  );
  if (onclickMatch?.[1]) return resolveUrl(onclickMatch[1], mirror);

  // Pattern 3: <a href="...pdf..."> download link
  const anchorMatch = html.match(
    /<a[^>]+href\s*=\s*["']([^"']+\.pdf[^"']*)["'][^>]*>/i,
  );
  if (anchorMatch?.[1]) return resolveUrl(anchorMatch[1], mirror);

  return null;
}

/**
 * Resolves protocol-relative ("//example.com/...") or relative ("/path")
 * URLs against the mirror base.
 */
function resolveUrl(rawUrl: string, mirror: string): string {
  if (rawUrl.startsWith("//")) return `https:${rawUrl}`;
  return new URL(rawUrl, mirror).toString();
}

export const SciHubClient = {
  generateLink,
  downloadPdf,
};
