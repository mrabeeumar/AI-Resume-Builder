import { z } from "zod";

// Shared confidence shape produced by both the resume and job description
// parsers. Confidence is computed deterministically by the service layer
// from field completeness — never trusted from the AI response — so low
// scores reliably indicate missing/ambiguous data rather than model whim.
export const parserConfidenceSchema = z.object({
  overall: z.number().min(0).max(100),
  sections: z.record(z.string(), z.number().min(0).max(100)),
  lowConfidenceFields: z.array(z.string()),
});
export type ParserConfidence = z.infer<typeof parserConfidenceSchema>;

export const PARSER_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Resumes must be a document (PDF/DOCX); job descriptions may additionally
// be submitted as plain text since they're often pasted directly.
export const PARSER_RESUME_MIME_TYPES = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
} as const;
export type ParserResumeMimeType = keyof typeof PARSER_RESUME_MIME_TYPES;
export function isSupportedParserResumeMimeType(
  mimeType: string,
): mimeType is ParserResumeMimeType {
  return mimeType in PARSER_RESUME_MIME_TYPES;
}

export const PARSER_JOB_MIME_TYPES = {
  ...PARSER_RESUME_MIME_TYPES,
  "text/plain": "TXT",
} as const;
export type ParserJobMimeType = keyof typeof PARSER_JOB_MIME_TYPES;
export function isSupportedParserJobMimeType(
  mimeType: string,
): mimeType is ParserJobMimeType {
  return mimeType in PARSER_JOB_MIME_TYPES;
}
