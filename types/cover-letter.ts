import { z } from "zod";

import {
  COVER_LETTER_TONES,
  PAGE_SIZES,
  RESUME_PAGE_COLORS,
} from "@/lib/enums";

export const COVER_LETTER_TONE_LABELS: Record<string, string> = {
  PROFESSIONAL: "Professional",
  FORMAL: "Formal",
  CONVERSATIONAL: "Conversational",
  ENTHUSIASTIC: "Enthusiastic",
  CONFIDENT: "Confident",
  CONCISE: "Concise",
  CREATIVE: "Creative",
  EXECUTIVE: "Executive",
  FRIENDLY: "Friendly",
  STORYTELLING: "Storytelling",
};

export const createCoverLetterSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  resumeId: z.string().trim().min(1).optional(),
  jobDescriptionId: z.string().trim().min(1).optional(),
  content: z.string().trim().max(8000).optional().default(""),
});
export type CreateCoverLetterInput = z.infer<typeof createCoverLetterSchema>;

export const updateCoverLetterSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200).optional(),
    content: z.string().trim().max(8000).optional(),
    resumeId: z.string().trim().min(1).nullable().optional(),
    jobDescriptionId: z.string().trim().min(1).nullable().optional(),
    pageColor: z.enum(RESUME_PAGE_COLORS).optional(),
    pageSize: z.enum(PAGE_SIZES).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.content !== undefined ||
      data.resumeId !== undefined ||
      data.jobDescriptionId !== undefined ||
      data.pageColor !== undefined ||
      data.pageSize !== undefined,
    { message: "At least one field must be provided" },
  );
export type UpdateCoverLetterInput = z.infer<typeof updateCoverLetterSchema>;

export const generateCoverLetterSchema = z.object({
  background: z.string().trim().min(20).max(4000),
  jobDescription: z.string().trim().max(8000).optional().default(""),
  tone: z.enum(COVER_LETTER_TONES).optional().default("PROFESSIONAL"),
});
export type GenerateCoverLetterInput = z.infer<typeof generateCoverLetterSchema>;

export const rewriteCoverLetterSchema = z.object({
  instructions: z.string().trim().max(500).optional().default(""),
  tone: z.enum(COVER_LETTER_TONES).optional().default("PROFESSIONAL"),
});
export type RewriteCoverLetterInput = z.infer<typeof rewriteCoverLetterSchema>;

export const customizeCoverLetterSchema = z.object({
  jobDescription: z.string().trim().min(20).max(8000),
  tone: z.enum(COVER_LETTER_TONES).optional().default("PROFESSIONAL"),
});
export type CustomizeCoverLetterInput = z.infer<typeof customizeCoverLetterSchema>;

export type CoverLetterListItem = {
  id: string;
  title: string;
  resumeId: string | null;
  jobDescriptionId: string | null;
  pageColor: string;
  pageSize: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CoverLetterItem = CoverLetterListItem & {
  content: string;
};
