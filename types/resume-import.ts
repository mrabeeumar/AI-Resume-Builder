export const IMPORT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const IMPORT_MIME_TYPES = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
} as const;

export type ImportMimeType = keyof typeof IMPORT_MIME_TYPES;

export function isSupportedImportMimeType(
  mimeType: string,
): mimeType is ImportMimeType {
  return mimeType in IMPORT_MIME_TYPES;
}
