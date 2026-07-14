import { z } from "zod";

import { INTERVIEW_DIFFICULTIES, INTERVIEW_QUESTION_CATEGORIES, HIRING_READINESS_LEVELS } from "@/lib/enums";

function optionalText(max: number) {
  return z.string().trim().max(max).optional().default("");
}

function stringList(max: number, itemMax = 200) {
  return z.array(z.string().trim().max(itemMax)).max(max).optional().default([]);
}

function score() {
  return z.number().min(0).max(100);
}

// AI output for a single generated interview question (see "Question
// Generation Logic" in .claude/roadmap/M20-Interview-questions.md). `greeting`
// is only populated by the service prompt for the first question of a
// session; every other turn leaves it empty.
export const interviewQuestionAIOutputSchema = z.object({
  greeting: optionalText(400),
  question: z.string().trim().min(1).max(1000),
  category: z.enum(INTERVIEW_QUESTION_CATEGORIES),
  difficulty: z.enum(INTERVIEW_DIFFICULTIES),
  resumeSection: optionalText(60),
  expectedSkills: stringList(15, 60),
  relatedProject: optionalText(120),
  estimatedAnswerSeconds: z.number().int().min(30).max(900).optional().default(120),
});
export type InterviewQuestionAIOutput = z.infer<
  typeof interviewQuestionAIOutputSchema
>;

// AI evaluation of a single answer across the six dimensions required by
// the "Answer Evaluation" section of the roadmap. `overallScore` here is a
// per-question figure; the session-level overallScore is computed
// deterministically as the average of these (see interview.service.ts).
export const interviewAnswerEvaluationAIOutputSchema = z.object({
  technicalAccuracy: score(),
  completeness: score(),
  communication: score(),
  confidence: score(),
  relevance: score(),
  practicalThinking: score(),
  overallScore: score(),
  strengths: stringList(10, 200),
  weaknesses: stringList(10, 200),
  missingPoints: stringList(10, 200),
  idealAnswer: optionalText(1200),
  improvementSuggestions: stringList(10, 300),
  feedback: optionalText(600),
});
export type InterviewAnswerEvaluationAIOutput = z.infer<
  typeof interviewAnswerEvaluationAIOutputSchema
>;

const improvementPlanSchema = z.object({
  topicsToStudy: stringList(15, 120),
  projectsToImprove: stringList(10, 200),
  practiceAreas: stringList(10, 120),
});

// AI output for the "Final Interview Report" section of the roadmap.
// technicalScore/communicationScore/confidenceScore/behavioralScore are
// qualitative rollups judged holistically by the model across the whole
// transcript; overallScore is computed deterministically by the service
// from per-question scores, mirroring the skill-gap pattern of combining
// deterministic scoring with AI-authored qualitative analysis.
export const interviewReportAIOutputSchema = z.object({
  technicalScore: score(),
  communicationScore: score(),
  confidenceScore: score(),
  behavioralScore: score(),
  strengths: stringList(10, 300),
  weaknesses: stringList(10, 300),
  frequentlyMissedTopics: stringList(10, 200),
  improvementPlan: improvementPlanSchema,
  hiringReadiness: z.enum(HIRING_READINESS_LEVELS),
  summary: optionalText(800),
});
export type InterviewReportAIOutput = z.infer<
  typeof interviewReportAIOutputSchema
>;
