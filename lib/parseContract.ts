import { MAX_CONTRACT_CHARS } from "./types";

export interface ParseResult {
  text: string;
  truncated: boolean;
}

const NBSP_REGEX = / /g;
const BLANK_LINES_REGEX = /\n{3,}/g;

/**
 * Truncates text to MAX_CONTRACT_CHARS, appending a notice when content was
 * cut so the user understands not everything was analyzed.
 */
function truncate(text: string): ParseResult {
  // Normalize non-breaking spaces and collapse excessive blank lines.
  const clean = text.replace(NBSP_REGEX, " ").replace(BLANK_LINES_REGEX, "\n\n").trim();
  if (clean.length <= MAX_CONTRACT_CHARS) {
    return { text: clean, truncated: false };
  }
  return {
    text:
      clean.slice(0, MAX_CONTRACT_CHARS) +
      "\n\n[Notice: This contract was truncated to the first 50,000 characters for analysis.]",
    truncated: true,
  };
}

/**
 * Extracts plain text from a PDF file in the browser using pdf.js.
 */
async function parsePdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // The worker is copied to /public at build time (see scripts/copy-pdf-worker.mjs)
  // and served as a static asset, keeping it out of the webpack/Terser pipeline.
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(strings);
  }

  return pages.join("\n\n");
}

/**
 * Extracts raw text from a DOCX file in the browser using mammoth.
 */
async function parseDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Parses an uploaded contract file (PDF, DOCX, or TXT) into plain text.
 * Throws a user-friendly error for unsupported types or unreadable files.
 */
export async function parseFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = file.type;

  let text: string;
  try {
    if (name.endsWith(".pdf") || type === "application/pdf") {
      text = await parsePdf(file);
    } else if (
      name.endsWith(".docx") ||
      type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      text = await parseDocx(file);
    } else if (name.endsWith(".txt") || type.startsWith("text/")) {
      text = await file.text();
    } else {
      throw new Error(
        "Unsupported file type. Please upload a PDF, DOCX, or TXT file.",
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Unsupported")) {
      throw err;
    }
    throw new Error(
      `Could not read "${file.name}". The file may be corrupted, password-protected, or contain only scanned images.`,
    );
  }

  const result = truncate(text);
  if (!result.text) {
    throw new Error(
      `No readable text was found in "${file.name}". Scanned PDFs without selectable text are not supported.`,
    );
  }

  return result.text;
}

/**
 * Normalizes pasted text and applies the same length cap as file uploads.
 */
export function parsePastedText(raw: string): string {
  return truncate(raw).text;
}
