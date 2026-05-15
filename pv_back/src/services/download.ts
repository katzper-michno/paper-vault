import https from "https";
import http from "http";

/**
 * Downloads a URL into a Buffer in memory, following redirects.
 */
function downloadToBuffer(url: string, maxRedirects = 5): Promise<Buffer> {
  console.log("current url: ", url);

  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) {
      return reject(new Error("Too many redirects"));
    }

    https
      .get(url, (res) => {
        if (
          res.statusCode !== undefined &&
          [301, 302, 303, 307, 308].includes(res.statusCode)
        ) {
          const location = res.headers.location;
          if (!location) {
            return reject(new Error("Redirect with no Location header"));
          }
          res.resume();
          // Resolve relative paths (e.g. "/pdf/2301.07041") against the current URL
          const nextUrl = new URL(location, url).toString();
          return resolve(downloadToBuffer(nextUrl, maxRedirects - 1));
        }

        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for URL: ${url}`));
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

/**
 * Fetches a URL and returns the response body as a string, following redirects.
 */
function fetchHtml(url: string, maxRedirects = 5): Promise<string> {
  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) return reject(new Error("Too many redirects"));

    const client = url.startsWith("https") ? https : http;

    client
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (
          res.statusCode !== undefined &&
          [301, 302, 303, 307, 308].includes(res.statusCode)
        ) {
          const location = res.headers.location;
          if (!location)
            return reject(new Error("Redirect with no Location header"));
          res.resume();
          return resolve(
            fetchHtml(new URL(location, url).toString(), maxRedirects - 1),
          );
        }

        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for URL: ${url}`));
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

export const DownloadService = {
  downloadToBuffer,
  fetchHtml,
};
