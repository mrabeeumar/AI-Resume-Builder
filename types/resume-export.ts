import { z } from "zod";

export const EXPORT_FORMATS = ["pdf", "docx"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const exportFormatSchema = z.enum(EXPORT_FORMATS);
