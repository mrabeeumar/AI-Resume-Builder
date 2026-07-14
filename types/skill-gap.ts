import { z } from "zod";

import type { SkillMatchResult } from "@/types/resume-tailoring";
import type { SkillGapAnalysisAIOutput } from "@/types/skill-gap.schema";

// Job description can be supplied as an id of a previously saved
// JobDescription, or as raw text (file uploads are handled at the route
// level via multipart form data — see app/api/resumes/[id]/skill-gap/route.ts,
// mirroring app/api/resumes/[id]/tailor/route.ts).
export const generateSkillGapAnalysisSchema = z.object({
  jobDescriptionId: z.string().trim().min(1).optional(),
  jobDescription: z.string().trim().max(12000).optional(),
  // Analyze a specific past version's content instead of the live resume.
  versionId: z.string().trim().min(1).optional(),
});
export type GenerateSkillGapAnalysisInput = z.infer<
  typeof generateSkillGapAnalysisSchema
>;

// Deterministic match scores (services/skill-matching.service.ts) plus the
// AI's qualitative gap analysis, combined into a single persisted report —
// matches the ReviewReport pattern in types/resume-review.ts.
export type SkillGapMatchScores = {
  overallScore: number;
  skillsMatchScore: number;
  experienceMatchScore: number;
  educationMatchScore: number;
  atsKeywordMatchScore: number;
};

export type SkillGapReport = SkillGapAnalysisAIOutput & {
  jobTitle: string;
  jobDescriptionId: string | null;
  scores: SkillGapMatchScores;
  skillMatch: SkillMatchResult;
  confidence: number;
};

export type SkillGapAnalysisListItem = {
  id: string;
  resumeId: string;
  versionId: string | null;
  jobDescriptionId: string | null;
  overallScore: number;
  createdAt: Date;
};

export type SkillGapAnalysisItem = SkillGapAnalysisListItem & {
  content: SkillGapReport;
};
