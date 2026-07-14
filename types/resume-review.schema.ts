import { z } from "zod";

import { REVIEW_PRIORITIES, SECTION_REVIEW_STATUSES } from "@/lib/enums";

// AI-produced portion of a resume review. The AI evaluates and comments on
// existing content only — see .claude/docs/ai.md's hallucination-prevention
// rule — it never invents skills, achievements, or resume facts, only
// critiques what is already there.

function optionalText(max: number) {
  return z.string().trim().max(max).optional().default("");
}

function stringList(max: number, itemMax = 300) {
  return z.array(z.string().trim().max(itemMax)).max(max).optional().default([]);
}

function score() {
  return z.number().min(0).max(100);
}

const sectionFindingSchema = z.object({
  section: optionalText(60),
  status: z.enum(SECTION_REVIEW_STATUSES),
  notes: optionalText(500),
});

const categoryFindingSchema = z.object({
  strengths: stringList(10),
  weaknesses: stringList(10),
  suggestions: stringList(10),
});

const grammarIssueSchema = z.object({
  issue: optionalText(300),
  suggestion: optionalText(300),
});

const recommendationSchema = z.object({
  priority: z.enum(REVIEW_PRIORITIES),
  problem: optionalText(300),
  reason: optionalText(300),
  suggestion: optionalText(300),
});

export const resumeReviewAIOutputSchema = z.object({
  scores: z.object({
    content: score(),
    readability: score(),
    grammar: score(),
    experience: score(),
  }),
  sections: z.array(sectionFindingSchema).max(10).optional().default([]),
  content: categoryFindingSchema,
  experience: categoryFindingSchema,
  skills: categoryFindingSchema.extend({
    missingSkills: stringList(20, 60),
  }),
  projects: categoryFindingSchema,
  education: categoryFindingSchema,
  grammar: z.object({
    issues: z.array(grammarIssueSchema).max(20).optional().default([]),
    tone: optionalText(200),
  }),
  recommendations: z.array(recommendationSchema).max(20).optional().default([]),
});
export type ResumeReviewAIOutput = z.infer<typeof resumeReviewAIOutputSchema>;
