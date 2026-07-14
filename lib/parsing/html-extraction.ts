// Shared by the Job Application URL import (M21). Fetches a public job
// posting page and reduces it to plain, readable text so it can be fed
// through the existing JOB_PARSING AI pipeline (services/job-parser.service.ts)
// rather than duplicating extraction logic.
export class HtmlExtractionError extends Error {
  constructor(
    message: string,
    public status: number = 422,
  ) {
    super(message);
    this.name = "HtmlExtractionError";
  }
}

const FETCH_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

// Only http(s) URLs are allowed, and hostnames are resolved by the runtime
// fetch — this rejects file://, javascript:, and similar unsafe schemes at
// the parse boundary (see roadmap M21 "Validate imported URLs").
export function assertSafeJobUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new HtmlExtractionError("The job URL is not valid.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new HtmlExtractionError("Only http/https job URLs are supported.");
  }

  return url;
}

export async function fetchHtml(rawUrl: string): Promise<string> {
  const url = assertSafeJobUrl(rawUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ResumeAIProBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch {
    throw new HtmlExtractionError(
      "The job posting could not be reached. Check the URL and try again.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new HtmlExtractionError(
      `The job posting page returned an error (${response.status}).`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("xml")) {
    throw new HtmlExtractionError(
      "The URL did not return an HTML page.",
    );
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_RESPONSE_BYTES) {
    throw new HtmlExtractionError("The job posting page is too large.");
  }

  const html = await response.text();
  if (html.length > MAX_RESPONSE_BYTES) {
    throw new HtmlExtractionError("The job posting page is too large.");
  }

  return html;
}

// Strips scripts/styles/tags and collapses whitespace/entities down to
// plain, readable text. Deliberately simple (regex-based, no DOM/cheerio
// dependency) since only plain text is needed downstream — the AI parser
// tolerates imperfect segmentation.
export function sanitizeHtmlToText(html: string): string {
  const withoutNonContent = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ");

  const withoutTags = withoutNonContent
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  const decoded = withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'");

  return decoded
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}
