import { z } from "zod";

import type { ResumeSectionType } from "@/lib/enums";

export const generateResumeSchema = z.object({
  background: z.string().trim().min(20).max(4000),
  jobDescription: z.string().trim().max(4000).optional().default(""),
});
export type GenerateResumeInput = z.infer<typeof generateResumeSchema>;

export const rewriteSectionSchema = z.object({
  instructions: z.string().trim().max(500).optional().default(""),
  jobDescription: z.string().trim().max(4000).optional().default(""),
});
export type RewriteSectionInput = z.infer<typeof rewriteSectionSchema>;

export const improveBulletSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  context: z.string().trim().max(200).optional().default(""),
});
export type ImproveBulletInput = z.infer<typeof improveBulletSchema>;

export const keywordOptimizeSchema = z.object({
  jobDescription: z.string().trim().min(20).max(4000),
});
export type KeywordOptimizeInput = z.infer<typeof keywordOptimizeSchema>;

// AI-generated content omits client-assigned item ids; the server attaches
// those after validation so generated items fit the same shape the editor
// (types/resume-section.ts) already expects.
const generatedExperienceItemSchema = z.object({
  company: z.string().trim().max(120).optional().default(""),
  role: z.string().trim().max(120).optional().default(""),
  location: z.string().trim().max(120).optional().default(""),
  startDate: z.string().trim().max(20).optional().default(""),
  endDate: z.string().trim().max(20).optional().default(""),
  current: z.boolean().optional().default(false),
  description: z.string().trim().max(2000).optional().default(""),
});

const generatedEducationItemSchema = z.object({
  school: z.string().trim().max(120).optional().default(""),
  degree: z.string().trim().max(120).optional().default(""),
  fieldOfStudy: z.string().trim().max(120).optional().default(""),
  startDate: z.string().trim().max(20).optional().default(""),
  endDate: z.string().trim().max(20).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
});

const generatedProjectItemSchema = z.object({
  name: z.string().trim().max(120).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
  url: z.string().trim().max(300).optional().default(""),
  technologies: z.string().trim().max(300).optional().default(""),
});

export const generatedResumeContentSchema = z.object({
  summary: z.string().trim().max(2000).optional().default(""),
  experience: z.array(generatedExperienceItemSchema).max(20).optional().default([]),
  education: z.array(generatedEducationItemSchema).max(20).optional().default([]),
  skills: z.array(z.string().trim().max(60)).max(40).optional().default([]),
  projects: z.array(generatedProjectItemSchema).max(20).optional().default([]),
});
export type GeneratedResumeContent = z.infer<typeof generatedResumeContentSchema>;

export const improvedBulletSchema = z.object({
  improved: z.string().trim().min(1).max(2000),
});
export type ImprovedBullet = z.infer<typeof improvedBulletSchema>;

export const keywordSuggestionsSchema = z.object({
  missingKeywords: z.array(z.string().trim().max(60)).max(30).optional().default([]),
  suggestions: z.array(z.string().trim().max(300)).max(15).optional().default([]),
});
export type KeywordSuggestions = z.infer<typeof keywordSuggestionsSchema>;

export const atsAnalyzeSchema = z.object({
  jobDescription: z.string().trim().max(4000).optional().default(""),
});
export type AtsAnalyzeInput = z.infer<typeof atsAnalyzeSchema>;

// The AI-produced portion of the ATS report. `missingSections` is computed
// deterministically by the service (from actual section content) rather
// than left to the model, so it lives outside this schema — see AtsReport.
export const atsAnalysisResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  keywordScore: z.number().min(0).max(100),
  skillsScore: z.number().min(0).max(100),
  readabilityScore: z.number().min(0).max(100),
  jobMatchScore: z.number().min(0).max(100).nullable().optional().default(null),
  missingKeywords: z.array(z.string().trim().max(60)).max(30).optional().default([]),
  suggestions: z.array(z.string().trim().max(300)).max(15).optional().default([]),
});
export type AtsAnalysisResult = z.infer<typeof atsAnalysisResultSchema>;

export type AtsReport = AtsAnalysisResult & {
  missingSections: ResumeSectionType[];
};

export type AtsReportListItem = {
  id: string;
  resumeId: string;
  overallScore: number;
  createdAt: Date;
};

export type AtsReportItem = AtsReportListItem & {
  content: AtsReport;
};

// Shared output shape for cover letter generation, rewriting, and
// customization — all three return a single plain-text letter body.
export const generatedCoverLetterSchema = z.object({
  content: z.string().trim().min(1).max(6000),
});
export type GeneratedCoverLetter = z.infer<typeof generatedCoverLetterSchema>;
