import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

// Shared by every feature that needs raw text out of an uploaded document
// (resume import, resume parsing, job description parsing) so the PDF/DOCX
// extraction logic exists in exactly one place.
export class DocumentExtractionError extends Error {
  constructor(
    message: string,
    public status: number = 422,
  ) {
    super(message);
    this.name = "DocumentExtractionError";
  }
}

export type ExtractableFile = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
};

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } catch {
    throw new DocumentExtractionError(
      "The PDF file could not be read. It may be corrupted or password-protected.",
    );
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch {
    throw new DocumentExtractionError(
      "The DOCX file could not be read. It may be corrupted.",
    );
  }
}

// Extracts raw text from a PDF, DOCX, or (when `allowPlainText`) plain-text
// file. Throws `DocumentExtractionError` for unsupported types, empty
// buffers, and unreadable/corrupted files.
export async function extractTextFromDocument(
  file: ExtractableFile,
  options: { allowPlainText?: boolean } = {},
): Promise<string> {
  if (file.buffer.byteLength === 0) {
    throw new DocumentExtractionError("The uploaded file is empty.");
  }

  if (file.buffer.byteLength > 5 * 1024 * 1024) {
    throw new DocumentExtractionError(
      "The uploaded file is too large. Maximum size is 5MB.",
    );
  }

  let text: string;

  if (file.mimeType === "application/pdf") {
    text = await extractPdfText(file.buffer);
  } else if (
    file.mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    text = await extractDocxText(file.buffer);
  } else if (options.allowPlainText && file.mimeType === "text/plain") {
    text = file.buffer.toString("utf-8").trim();
  } else {
    throw new DocumentExtractionError(
      options.allowPlainText
        ? "Unsupported file type. Please upload a PDF, DOCX, or plain text file."
        : "Unsupported file type. Please upload a PDF or DOCX file.",
    );
  }

  if (!text) {
    throw new DocumentExtractionError(
      "No readable text was found in the uploaded file.",
    );
  }

  return text;
}
