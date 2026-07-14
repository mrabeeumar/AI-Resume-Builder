import { z } from "zod";

function optionalText(max: number) {
  return z.string().trim().max(max).optional().default("");
}

function stringList(max: number, itemMax = 200) {
  return z.array(z.string().trim().max(itemMax)).max(max).optional().default([]);
}

// Deterministic skill matching (services/skill-matching.service.ts) already
// tells us *which* required/preferred skills and keywords are missing. The
// AI's job here is qualitative: categorize those gaps, judge experience and
// education alignment, and prioritize a learning roadmap — things that
// benefit from judgment rather than a lookup (see .claude/docs/ai.md).
const categorizedSkillsSchema = z.object({
  technical: stringList(30, 60),
  softSkills: stringList(20, 60),
  tools: stringList(20, 60),
  frameworks: stringList(20, 60),
  languages: stringList(20, 60),
  databases: stringList(15, 60),
  cloudTechnologies: stringList(15, 60),
});

const experienceAnalysisSchema = z.object({
  relevantExperience: stringList(15, 300),
  missingExperience: stringList(15, 300),
  experienceLevelMatch: optionalText(200),
  domainMatch: optionalText(200),
  projectRelevance: optionalText(300),
});

const educationAnalysisSchema = z.object({
  degreeRequirementsMet: z.boolean().optional().default(true),
  missingCertifications: stringList(15, 120),
  additionalQualificationsNeeded: stringList(15, 200),
  notes: optionalText(300),
});

const roadmapItemSchema = z.object({
  title: optionalText(120),
  description: optionalText(400),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

const learningRoadmapSchema = z.object({
  skillsToLearnFirst: stringList(15, 60),
  suggestedTechnologies: stringList(15, 60),
  recommendedCertifications: stringList(10, 120),
  portfolioProjectIdeas: z.array(roadmapItemSchema).max(10).optional().default([]),
  resumeImprovementSuggestions: stringList(15, 300),
});

const strengthAnalysisSchema = z.object({
  existingStrengths: stringList(15, 300),
  competitiveAdvantages: stringList(15, 300),
  relevantExperienceHighlights: stringList(15, 300),
});

export const skillGapAnalysisAIOutputSchema = z.object({
  missingSkills: categorizedSkillsSchema,
  experience: experienceAnalysisSchema,
  education: educationAnalysisSchema,
  roadmap: learningRoadmapSchema,
  strengths: strengthAnalysisSchema,
  summary: optionalText(600),
});
export type SkillGapAnalysisAIOutput = z.infer<
  typeof skillGapAnalysisAIOutputSchema
>;
