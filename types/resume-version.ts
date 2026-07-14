import { z } from "zod";

import type {
  PageSize,
  ResumePageColor,
  ResumeSectionType,
  ResumeTemplateId,
  ResumeThemeColor,
} from "@/lib/enums";

export const createVersionSchema = z.object({
  note: z.string().trim().min(1, "Please name this version.").max(200),
});
export type CreateVersionInput = z.infer<typeof createVersionSchema>;

export type ResumeSnapshotSection = {
  type: ResumeSectionType;
  order: number;
  hidden: boolean;
  content: unknown;
};

export type ResumeSnapshot = {
  title: string;
  status: string;
  templateId: ResumeTemplateId;
  themeColor: ResumeThemeColor;
  pageColor: ResumePageColor;
  pageSize: PageSize;
  sections: ResumeSnapshotSection[];
};

export type ResumeVersionListItem = {
  id: string;
  resumeId: string;
  versionNumber: number;
  note: string | null;
  createdAt: Date;
};

export type ResumeVersionItem = ResumeVersionListItem & {
  content: ResumeSnapshot;
};
