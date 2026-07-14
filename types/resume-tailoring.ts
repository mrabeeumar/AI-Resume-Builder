import { z } from "zod";

import type { ParsedJobDescription } from "@/types/job-parser.schema";
import type { ResumeSnapshot } from "@/types/resume-version";
import type { TailoredResumeAIOutput } from "@/types/resume-tailoring.schema";

// Job description can be supplied as an id of a previously saved
// JobDescription, or as raw text (file uploads are handled at the route
// level via multipart form data, then passed through as `{ kind: "file" }`
// to the job parser — see app/api/resumes/[id]/tailor/route.ts).
export const tailorResumeSchema = z.object({
  jobDescriptionId: z.string().trim().min(1).optional(),
  jobDescription: z.string().trim().max(12000).optional(),
  // Tailor a specific past version's content instead of the live resume.
  sourceVersionId: z.string().trim().min(1).optional(),
});
export type TailorResumeInput = z.infer<typeof tailorResumeSchema>;

export const saveTailoredResumeSchema = z.object({
  note: z.string().trim().max(200).optional(),
  jobDescriptionId: z.string().trim().min(1).nullable().optional(),
  jobTitle: z.string().trim().max(200).optional().default(""),
  jobAnalysis: z.custom<ParsedJobDescription>(),
  tailored: z.custom<TailoredResumeAIOutput>(),
  matchScore: z.custom<MatchScore>(),
  confidence: z.number().min(0).max(100),
  summary: z.custom<TailoringSummary>(),
});
export type SaveTailoredResumeInput = z.infer<typeof saveTailoredResumeSchema>;

export type SkillMatchResult = {
  matchingSkills: string[];
  missingSkills: string[];
  strongMatches: string[];
  weakMatches: string[];
  keywordCoverage: number;
  skillMatchScore: number;
};

export type MatchScore = {
  overallScore: number;
  skillMatchScore: number;
  experienceMatchScore: number;
  atsScore: number;
  keywordCoverageScore: number;
};

export type TailoringSummary = {
  overallImprovements: string[];
  sectionsModified: string[];
  keywordsIncorporated: string[];
  missingSkillsIdentified: string[];
  recommendations: string[];
};

// The full preview returned by `generateTailoredResume`. Nothing here is
// persisted until the user explicitly calls `saveTailoredResume`.
export type TailoringResponse = {
  jobDescriptionId: string | null;
  jobTitle: string;
  jobAnalysis: ParsedJobDescription;
  skillMatch: SkillMatchResult;
  tailored: TailoredResumeAIOutput;
  matchScore: MatchScore;
  summary: TailoringSummary;
  confidence: number;
  warnings: string[];
};

// Metadata attached to a ResumeVersion created by saveTailoredResume,
// stored alongside the tailored ResumeSnapshot content (see
// types/resume-version.ts).
export type TailoringMetadata = {
  jobDescriptionId: string | null;
  jobTitle: string;
  matchScore: MatchScore;
  confidenceScore: number;
  summary: TailoringSummary;
  tailoredAt: string;
};

export type TailoredResumeSnapshot = ResumeSnapshot & {
  tailoring?: TailoringMetadata;
};
