import { z } from "zod";

import type { ResumeSectionType } from "@/lib/enums";
import type { AtsReport } from "@/types/ai";
import type { ResumeReviewAIOutput } from "@/types/resume-review.schema";

export const generateReviewSchema = z.object({
  // Review a specific past version's content instead of the live resume.
  versionId: z.string().trim().min(1).optional(),
});
export type GenerateReviewInput = z.infer<typeof generateReviewSchema>;

// `missingSections` is computed deterministically from actual section
// content (see resume-review.service.ts), matching the pattern used for
// AtsReport, rather than left to the model.
export type ReviewReport = ResumeReviewAIOutput & {
  scores: ResumeReviewAIOutput["scores"] & {
    overall: number;
    ats: number;
  };
  missingSections: ResumeSectionType[];
  ats: AtsReport;
};

export type ResumeReviewListItem = {
  id: string;
  resumeId: string;
  versionId: string | null;
  overallScore: number;
  createdAt: Date;
};

export type ResumeReviewItem = ResumeReviewListItem & {
  content: ReviewReport;
};
