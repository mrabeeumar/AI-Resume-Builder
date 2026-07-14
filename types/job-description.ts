import { z } from "zod";

import { JOB_DESCRIPTION_SOURCES } from "@/lib/enums";

export const createJobDescriptionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  company: z.string().trim().max(200).optional().default(""),
  content: z.string().trim().min(20, "Add the full job description").max(8000),
  source: z.enum(JOB_DESCRIPTION_SOURCES).optional().default("MANUAL"),
});
export type CreateJobDescriptionInput = z.infer<typeof createJobDescriptionSchema>;

export const updateJobDescriptionSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200).optional(),
    company: z.string().trim().max(200).optional(),
    content: z
      .string()
      .trim()
      .min(20, "Add the full job description")
      .max(8000)
      .optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.company !== undefined ||
      data.content !== undefined,
    { message: "At least one field must be provided" },
  );
export type UpdateJobDescriptionInput = z.infer<typeof updateJobDescriptionSchema>;

export type JobDescriptionListItem = {
  id: string;
  title: string;
  company: string | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
};

export type JobDescriptionItem = JobDescriptionListItem & {
  content: string;
};
