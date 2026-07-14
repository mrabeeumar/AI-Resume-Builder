import { z } from "zod";

export const createCoverLetterVersionSchema = z.object({
  note: z.string().trim().min(1, "Please name this version.").max(200),
});
export type CreateCoverLetterVersionInput = z.infer<
  typeof createCoverLetterVersionSchema
>;

export type CoverLetterSnapshot = {
  title: string;
  content: string;
};

export type CoverLetterVersionListItem = {
  id: string;
  coverLetterId: string;
  versionNumber: number;
  note: string | null;
  createdAt: Date;
};

export type CoverLetterVersionItem = CoverLetterVersionListItem & {
  content: CoverLetterSnapshot;
};
