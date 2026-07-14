import { z } from "zod";

import {
  INTERVIEW_DIFFICULTIES,
  INTERVIEW_FEEDBACK_MODES,
  INTERVIEW_QUESTION_COUNTS,
  INTERVIEW_TYPES,
  type HiringReadiness,
  type InterviewDifficulty,
  type InterviewFeedbackMode,
  type InterviewQuestionCategory,
  type InterviewSessionStatus,
  type InterviewType,
} from "@/lib/enums";
import type {
  InterviewAnswerEvaluationAIOutput,
  InterviewReportAIOutput,
} from "@/types/interview.schema";

// Unlimited is represented as `null` on the wire and in the database, capped
// at INTERVIEW_MAX_QUESTIONS server-side (services/interview.service.ts) so
// an "unlimited" session can't run away indefinitely.
export const startInterviewSchema = z.object({
  interviewType: z.enum(INTERVIEW_TYPES),
  difficulty: z.enum(INTERVIEW_DIFFICULTIES),
  questionCount: z
    .union([z.literal(INTERVIEW_QUESTION_COUNTS[0]), z.literal(INTERVIEW_QUESTION_COUNTS[1]), z.literal(INTERVIEW_QUESTION_COUNTS[2]), z.null()])
    .optional()
    .default(null),
  feedbackMode: z.enum(INTERVIEW_FEEDBACK_MODES),
  jobDescriptionId: z.string().trim().min(1).optional(),
  coverLetterId: z.string().trim().min(1).optional(),
  versionId: z.string().trim().min(1).optional(),
});
export type StartInterviewInput = z.infer<typeof startInterviewSchema>;

export const submitInterviewAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(6000),
});
export type SubmitInterviewAnswerInput = z.infer<
  typeof submitInterviewAnswerSchema
>;

export type InterviewQuestionItem = {
  id: string;
  order: number;
  question: string;
  category: InterviewQuestionCategory;
  difficulty: InterviewDifficulty;
  resumeSection: string | null;
  expectedSkills: string[];
  relatedProject: string | null;
  estimatedAnswerSeconds: number | null;
  userAnswer: string | null;
  aiEvaluation: InterviewAnswerEvaluationAIOutput | null;
  score: number | null;
  createdAt: Date;
  answeredAt: Date | null;
};

export type InterviewSessionListItem = {
  id: string;
  resumeId: string;
  versionId: string | null;
  jobDescriptionId: string | null;
  coverLetterId: string | null;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  questionCount: number | null;
  feedbackMode: InterviewFeedbackMode;
  status: InterviewSessionStatus;
  startedAt: Date;
  completedAt: Date | null;
  duration: number | null;
  overallScore: number | null;
};

export type InterviewReport = InterviewReportAIOutput & {
  overallScore: number;
  interviewType: InterviewType;
  questionCount: number;
  hiringReadiness: HiringReadiness;
};

export type InterviewSessionItem = InterviewSessionListItem & {
  questions: InterviewQuestionItem[];
  finalReport: InterviewReport | null;
};

export type StartInterviewReply = {
  session: InterviewSessionListItem;
  greeting: string;
  firstQuestion: InterviewQuestionItem;
};

export type SubmitInterviewAnswerReply = {
  evaluatedQuestion: InterviewQuestionItem;
  nextQuestion: InterviewQuestionItem | null;
  completed: boolean;
};

export type EndInterviewReply = {
  session: InterviewSessionItem;
};

export const INTERVIEW_MAX_QUESTIONS = 30;
