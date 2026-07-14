import { beforeEach, describe, expect, it, vi } from "vitest";

const extractRawTextMock = vi.fn();
const getTextMock = vi.fn();
const destroyMock = vi.fn();

vi.mock("mammoth", () => ({
  default: { extractRawText: (...args: unknown[]) => extractRawTextMock(...args) },
}));

class MockPDFParse {
  getText(...args: unknown[]) {
    return getTextMock(...args);
  }
  destroy(...args: unknown[]) {
    return destroyMock(...args);
  }
}

vi.mock("pdf-parse", () => ({ PDFParse: MockPDFParse }));

const { DocumentExtractionError, extractTextFromDocument } = await import(
  "@/lib/parsing/document-extraction"
);

describe("extractTextFromDocument", () => {
  beforeEach(() => {
    extractRawTextMock.mockReset();
    getTextMock.mockReset();
    destroyMock.mockReset();
  });

  it("rejects an empty buffer", async () => {
    await expect(
      extractTextFromDocument({
        buffer: Buffer.alloc(0),
        filename: "resume.pdf",
        mimeType: "application/pdf",
      }),
    ).rejects.toThrow(DocumentExtractionError);
  });

  it("rejects an unsupported mime type", async () => {
    await expect(
      extractTextFromDocument({
        buffer: Buffer.from("hello"),
        filename: "resume.exe",
        mimeType: "application/x-msdownload",
      }),
    ).rejects.toThrow(/Unsupported file type/);
  });

  it("extracts text from a PDF and always destroys the parser", async () => {
    getTextMock.mockResolvedValue({ text: "  Resume content  " });

    const text = await extractTextFromDocument({
      buffer: Buffer.from("pdf-bytes"),
      filename: "resume.pdf",
      mimeType: "application/pdf",
    });

    expect(text).toBe("Resume content");
    expect(destroyMock).toHaveBeenCalledOnce();
  });

  it("wraps PDF parsing failures and still destroys the parser", async () => {
    getTextMock.mockRejectedValue(new Error("corrupt"));

    await expect(
      extractTextFromDocument({
        buffer: Buffer.from("pdf-bytes"),
        filename: "resume.pdf",
        mimeType: "application/pdf",
      }),
    ).rejects.toThrow(/could not be read/);
    expect(destroyMock).toHaveBeenCalledOnce();
  });

  it("extracts text from a DOCX file", async () => {
    extractRawTextMock.mockResolvedValue({ value: "Docx content" });

    const text = await extractTextFromDocument({
      buffer: Buffer.from("docx-bytes"),
      filename: "resume.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    expect(text).toBe("Docx content");
  });

  it("rejects plain text unless explicitly allowed", async () => {
    await expect(
      extractTextFromDocument({
        buffer: Buffer.from("some text"),
        filename: "job.txt",
        mimeType: "text/plain",
      }),
    ).rejects.toThrow(/Unsupported file type/);
  });

  it("extracts plain text when allowPlainText is set", async () => {
    const text = await extractTextFromDocument(
      {
        buffer: Buffer.from(" Job description text "),
        filename: "job.txt",
        mimeType: "text/plain",
      },
      { allowPlainText: true },
    );

    expect(text).toBe("Job description text");
  });

  it("rejects a document that extracts to no readable text", async () => {
    extractRawTextMock.mockResolvedValue({ value: "   " });

    await expect(
      extractTextFromDocument({
        buffer: Buffer.from("docx-bytes"),
        filename: "resume.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ).rejects.toThrow(/No readable text/);
  });
});
