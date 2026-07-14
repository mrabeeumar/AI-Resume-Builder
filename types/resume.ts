import { z } from "zod";

import {
  PAGE_SIZES,
  RESUME_PAGE_COLORS,
  RESUME_STATUSES,
  RESUME_TEMPLATE_IDS,
  RESUME_THEME_COLORS,
} from "@/lib/enums";

export const createResumeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title is too long"),
});

export const updateResumeSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Title is too long")
      .optional(),
    status: z.enum(RESUME_STATUSES).optional(),
    templateId: z.enum(RESUME_TEMPLATE_IDS).optional(),
    themeColor: z.enum(RESUME_THEME_COLORS).optional(),
    pageColor: z.enum(RESUME_PAGE_COLORS).optional(),
    pageSize: z.enum(PAGE_SIZES).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.status !== undefined ||
      data.templateId !== undefined ||
      data.themeColor !== undefined ||
      data.pageColor !== undefined ||
      data.pageSize !== undefined,
    { message: "At least one field must be provided" },
  );

export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;

export type ResumeListItem = {
  id: string;
  title: string;
  status: string;
  templateId: string;
  themeColor: string;
  pageColor: string;
  pageSize: string;
  createdAt: Date;
  updatedAt: Date;
};
