import "@/lib/ai/prompts";

import type { InterviewQuestion, InterviewSession } from "@prisma/client";

import { getPrompt } from "@/lib/ai/prompt-manager";
import type {
  InterviewDifficulty,
  InterviewFeedbackMode,
  InterviewQuestionCategory,
  InterviewSessionStatus,
  InterviewType,
  ResumeSectionType,
} from "@/lib/enums";
import { createWithSequenceRetry, prisma } from "@/lib/prisma";
import { generateAIJSON } from "@/services/ai.service";
import { getOwnedCoverLetterOrThrow } from "@/services/cover-letter.service";
import { getOwnedJobDescriptionOrThrow } from "@/services/job-description.service";
import { getOwnedResumeOrThrow } from "@/services/resume.service";
import { getVersionForResume } from "@/services/resume-version.service";
import {
  INTERVIEW_MAX_QUESTIONS,
  startInterviewSchema,
  submitInterviewAnswerSchema,
  type EndInterviewReply,
  type InterviewQuestionItem,
  type InterviewReport,
  type InterviewSessionItem,
  type InterviewSessionListItem,
  type StartInterviewInput,
  type StartInterviewReply,
  type SubmitInterviewAnswerInput,
  type SubmitInterviewAnswerReply,
} from "@/types/interview";
import {
  interviewAnswerEvaluationAIOutputSchema,
  interviewQuestionAIOutputSchema,
  interviewReportAIOutputSchema,
  type InterviewAnswerEvaluationAIOutput,
} from "@/types/interview.schema";
import {
  parseSectionContent,
  type CertificationsContent,
  type EducationContent,
  type ExperienceContent,
  type ProjectsContent,
  type SkillsContent,
  type SummaryContent,
} from "@/types/resume-section";
import type { ResumeSnapshotSection } from "@/types/resume-version";

export class InterviewServiceError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "InterviewServiceError";
  }
}

async function loadInterviewSections(
  resumeId: string,
  userId: string,
  versionId?: string,
): Promise<ResumeSnapshotSection[]> {
  if (versionId) {
    const version = await getVersionForResume(resumeId, versionId, userId);
    return version.content.sections;
  }

  const sections = await prisma.resumeSection.findMany({
    where: { resumeId },
    orderBy: { order: "asc" },
  });

  return sections.map((section) => ({
    type: section.type as ResumeSectionType,
    order: section.order,
    hidden: section.hidden,
    content: JSON.parse(section.content),
  }));
}

// Trimmed, human-readable resume context sent to the model — only the
// fields relevant to interviewing, per the token-economy rule in
// .claude/docs/ai.md. Mirrors buildResumeContext in
// skill-gap-analysis.service.ts and resume-assistant-context.service.ts.
function buildResumeContext(sections: ResumeSnapshotSection[]): string {
  const parts: string[] = [];

  const summary = parseSectionContent(
    "SUMMARY",
    sections.find((s) => s.type === "SUMMARY")?.content ?? {},
  ) as SummaryContent;
  if (summary.text) parts.push(`Summary: ${summary.text}`);

  const experience = parseSectionContent(
    "EXPERIENCE",
    sections.find((s) => s.type === "EXPERIENCE")?.content ?? {},
  ) as ExperienceContent;
  for (const item of experience.items) {
    parts.push(
      `Experience (${item.role} at ${item.company}, ` +
        `${item.startDate}–${item.current ? "Present" : item.endDate}): ` +
        `${item.description}`,
    );
  }

  const education = parseSectionContent(
    "EDUCATION",
    sections.find((s) => s.type === "EDUCATION")?.content ?? {},
  ) as EducationContent;
  for (const item of education.items) {
    parts.push(`Education: ${item.degree} in ${item.fieldOfStudy} at ${item.school}`);
  }

  const skills = parseSectionContent(
    "SKILLS",
    sections.find((s) => s.type === "SKILLS")?.content ?? {},
  ) as SkillsContent;
  if (skills.items.length > 0) {
    parts.push(`Skills: ${skills.items.join(", ")}`);
  }

  const projects = parseSectionContent(
    "PROJECTS",
    sections.find((s) => s.type === "PROJECTS")?.content ?? {},
  ) as ProjectsContent;
  for (const item of projects.items) {
    parts.push(`Project (${item.name}, tech: ${item.technologies}): ${item.description}`);
  }

  const certifications = parseSectionContent(
    "CERTIFICATIONS",
    sections.find((s) => s.type === "CERTIFICATIONS")?.content ?? {},
  ) as CertificationsContent;
  for (const item of certifications.items) {
    parts.push(`Certification: ${item.name} — ${item.issuer}`);
  }

  return parts.join("\n") || "The resume has no content yet.";
}

const JOB_CONTEXT_MAX_CHARS = 3000;
const COVER_LETTER_CONTEXT_MAX_CHARS = 2000;

async function buildJobContext(
  jobDescriptionId: string | undefined,
  userId: string,
): Promise<{ jobTitle: string; jobContext: string }> {
  if (!jobDescriptionId) {
    return { jobTitle: "", jobContext: "No job description provided." };
  }

  const job = await getOwnedJobDescriptionOrThrow(jobDescriptionId, userId);
  const content = job.content.slice(0, JOB_CONTEXT_MAX_CHARS);

  return {
    jobTitle: job.title,
    jobContext:
      `Title: ${job.title}\n` +
      `Company: ${job.company ?? "Unspecified"}\n` +
      `Description:\n${content}`,
  };
}

async function buildCoverLetterContext(
  coverLetterId: string | undefined,
  userId: string,
): Promise<string> {
  if (!coverLetterId) {
    return "No cover letter provided.";
  }

  const coverLetter = await getOwnedCoverLetterOrThrow(coverLetterId, userId);
  return coverLetter.content.slice(0, COVER_LETTER_CONTEXT_MAX_CHARS);
}

// Renders every already-answered question/evaluation pair as conversation
// history so the next question can adapt to prior answers (roadmap: "Adapt
// questions based on previous answers") without the model re-asking or
// revealing future questions.
function buildPreviousQAContext(questions: InterviewQuestion[]): string {
  const answered = questions.filter((q) => q.userAnswer);
  if (answered.length === 0) return "No questions asked yet.";

  return answered
    .map(
      (q) =>
        `Q${q.order} [${q.category}/${q.difficulty}]: ${q.question}\nCandidate's answer: ${q.userAnswer}`,
    )
    .join("\n\n");
}

function buildTranscriptContext(questions: InterviewQuestion[]): string {
  const answered = questions.filter((q) => q.userAnswer && q.aiEvaluation);
  return answered
    .map((q) => {
      const evaluation = JSON.parse(
        q.aiEvaluation as string,
      ) as InterviewAnswerEvaluationAIOutput;
      return (
        `Q${q.order} [${q.category}/${q.difficulty}]: ${q.question}\n` +
        `Answer: ${q.userAnswer}\n` +
        `Score: ${q.score}/100 (technical ${evaluation.technicalAccuracy}, ` +
        `completeness ${evaluation.completeness}, communication ${evaluation.communication}, ` +
        `confidence ${evaluation.confidence}, relevance ${evaluation.relevance}, ` +
        `practical thinking ${evaluation.practicalThinking})\n` +
        `Strengths: ${evaluation.strengths.join("; ") || "none"}\n` +
        `Weaknesses: ${evaluation.weaknesses.join("; ") || "none"}`
      );
    })
    .join("\n\n");
}

function effectiveMaxQuestions(questionCount: number | null): number {
  return questionCount ?? INTERVIEW_MAX_QUESTIONS;
}

function serializeQuestion(question: InterviewQuestion): InterviewQuestionItem {
  return {
    id: question.id,
    order: question.order,
    question: question.question,
    category: question.category as InterviewQuestionCategory,
    difficulty: question.difficulty as InterviewDifficulty,
    resumeSection: question.resumeSection,
    expectedSkills: question.expectedSkills
      ? (JSON.parse(question.expectedSkills) as string[])
      : [],
    relatedProject: question.relatedProject,
    estimatedAnswerSeconds: question.estimatedAnswerSeconds,
    userAnswer: question.userAnswer,
    aiEvaluation: question.aiEvaluation
      ? (JSON.parse(question.aiEvaluation) as InterviewAnswerEvaluationAIOutput)
      : null,
    score: question.score,
    createdAt: question.createdAt,
    answeredAt: question.answeredAt,
  };
}

function serializeSession(session: InterviewSession): InterviewSessionListItem {
  return {
    id: session.id,
    resumeId: session.resumeId,
    versionId: session.versionId,
    jobDescriptionId: session.jobDescriptionId,
    coverLetterId: session.coverLetterId,
    interviewType: session.interviewType as InterviewType,
    difficulty: session.difficulty as InterviewDifficulty,
    questionCount: session.questionCount,
    feedbackMode: session.feedbackMode as InterviewFeedbackMode,
    status: session.status as InterviewSessionStatus,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    duration: session.duration,
    overallScore: session.overallScore,
  };
}

async function getOwnedInterviewSessionOrThrow(
  resumeId: string,
  interviewId: string,
  userId: string,
): Promise<InterviewSession> {
  const session = await prisma.interviewSession.findUnique({
    where: { id: interviewId },
  });

  if (
    !session ||
    session.resumeId !== resumeId ||
    session.userId !== userId
  ) {
    throw new InterviewServiceError("Interview session not found.", 404);
  }

  return session;
}

// Starts a new mock interview session for the given resume, generating the
// first question immediately so the client has something to render right
// away (see "User Workflow — Step 3/4" in
// .claude/roadmap/M20-Interview-questions.md). The resume version is always
// the primary context; a saved job description and/or cover letter are
// optional supplementary context.
export async function startInterview(
  resumeId: string,
  userId: string,
  input: StartInterviewInput,
): Promise<StartInterviewReply> {
  await getOwnedResumeOrThrow(resumeId, userId);
  const parsed = startInterviewSchema.parse(input);

  const [sections, { jobContext }, coverLetterContext] = await Promise.all([
    loadInterviewSections(resumeId, userId, parsed.versionId),
    buildJobContext(parsed.jobDescriptionId, userId),
    buildCoverLetterContext(parsed.coverLetterId, userId),
  ]);
  const resumeContext = buildResumeContext(sections);

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      resumeId,
      versionId: parsed.versionId ?? null,
      jobDescriptionId: parsed.jobDescriptionId ?? null,
      coverLetterId: parsed.coverLetterId ?? null,
      interviewType: parsed.interviewType,
      difficulty: parsed.difficulty,
      questionCount: parsed.questionCount,
      feedbackMode: parsed.feedbackMode,
      status: "IN_PROGRESS",
    },
  });

  const template = getPrompt("INTERVIEW_QUESTION_GENERATION");
  const aiOutput = await generateAIJSON({
    feature: "INTERVIEW_QUESTION_GENERATION",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({
      resumeContext,
      jobContext,
      coverLetterContext,
      interviewType: parsed.interviewType,
      difficulty: parsed.difficulty,
      questionNumber: "1",
      totalQuestions: parsed.questionCount ? String(parsed.questionCount) : "unlimited",
      previousQAContext: "No questions asked yet.",
      isFirst: "true",
    }),
    schema: interviewQuestionAIOutputSchema,
  });

  const question = await prisma.interviewQuestion.create({
    data: {
      interviewSessionId: session.id,
      order: 1,
      question: aiOutput.question,
      category: aiOutput.category,
      difficulty: aiOutput.difficulty,
      resumeSection: aiOutput.resumeSection || null,
      expectedSkills: JSON.stringify(aiOutput.expectedSkills),
      relatedProject: aiOutput.relatedProject || null,
      estimatedAnswerSeconds: aiOutput.estimatedAnswerSeconds,
    },
  });

  return {
    session: serializeSession(session),
    greeting: aiOutput.greeting,
    firstQuestion: serializeQuestion(question),
  };
}

// Processes one answer turn: persists the candidate's answer, evaluates it
// across the six scoring dimensions, and — unless the question limit has
// been reached — generates the next adapted question. Mirrors the
// single-turn orchestration pattern in resume-assistant.service.ts.
export async function submitInterviewAnswer(
  resumeId: string,
  interviewId: string,
  userId: string,
  input: SubmitInterviewAnswerInput,
): Promise<SubmitInterviewAnswerReply> {
  await getOwnedResumeOrThrow(resumeId, userId);
  const session = await getOwnedInterviewSessionOrThrow(resumeId, interviewId, userId);

  if (session.status !== "IN_PROGRESS") {
    throw new InterviewServiceError("This interview has already ended.", 409);
  }

  const { answer } = submitInterviewAnswerSchema.parse(input);

  const questions = await prisma.interviewQuestion.findMany({
    where: { interviewSessionId: interviewId },
    orderBy: { order: "asc" },
  });

  const currentQuestion = questions.find((q) => !q.userAnswer);
  if (!currentQuestion) {
    throw new InterviewServiceError("There is no open question to answer.", 409);
  }

  const sections = await loadInterviewSections(resumeId, userId, session.versionId ?? undefined);
  const resumeContext = buildResumeContext(sections);

  const evaluationTemplate = getPrompt("INTERVIEW_ANSWER_EVALUATION");
  const evaluation = await generateAIJSON({
    feature: "INTERVIEW_ANSWER_EVALUATION",
    userId,
    system: evaluationTemplate.system,
    prompt: evaluationTemplate.buildUserPrompt({
      resumeContext,
      question: currentQuestion.question,
      category: currentQuestion.category,
      answer,
    }),
    schema: interviewAnswerEvaluationAIOutputSchema,
  });

  const answeredQuestion = await prisma.interviewQuestion.update({
    where: { id: currentQuestion.id },
    data: {
      userAnswer: answer,
      aiEvaluation: JSON.stringify(evaluation),
      score: evaluation.overallScore,
      answeredAt: new Date(),
    },
  });

  const maxQuestions = effectiveMaxQuestions(session.questionCount);
  if (currentQuestion.order >= maxQuestions) {
    return {
      evaluatedQuestion: serializeQuestion(answeredQuestion),
      nextQuestion: null,
      completed: true,
    };
  }

  const allQuestions = [...questions.filter((q) => q.id !== currentQuestion.id), answeredQuestion].sort(
    (a, b) => a.order - b.order,
  );
  const [{ jobContext }, coverLetterContext] = await Promise.all([
    buildJobContext(session.jobDescriptionId ?? undefined, userId),
    buildCoverLetterContext(session.coverLetterId ?? undefined, userId),
  ]);

  const questionTemplate = getPrompt("INTERVIEW_QUESTION_GENERATION");
  const nextOrder = currentQuestion.order + 1;
  const aiOutput = await generateAIJSON({
    feature: "INTERVIEW_QUESTION_GENERATION",
    userId,
    system: questionTemplate.system,
    prompt: questionTemplate.buildUserPrompt({
      resumeContext,
      jobContext,
      coverLetterContext,
      interviewType: session.interviewType,
      difficulty: session.difficulty,
      questionNumber: String(nextOrder),
      totalQuestions: session.questionCount ? String(session.questionCount) : "unlimited",
      previousQAContext: buildPreviousQAContext(allQuestions),
      isFirst: "false",
    }),
    schema: interviewQuestionAIOutputSchema,
  });

  const nextQuestion = await createWithSequenceRetry(async () => {
    const last = await prisma.interviewQuestion.findFirst({
      where: { interviewSessionId: interviewId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    return prisma.interviewQuestion.create({
      data: {
        interviewSessionId: interviewId,
        order: (last?.order ?? 0) + 1,
        question: aiOutput.question,
        category: aiOutput.category,
        difficulty: aiOutput.difficulty,
        resumeSection: aiOutput.resumeSection || null,
        expectedSkills: JSON.stringify(aiOutput.expectedSkills),
        relatedProject: aiOutput.relatedProject || null,
        estimatedAnswerSeconds: aiOutput.estimatedAnswerSeconds,
      },
    });
  });

  return {
    evaluatedQuestion: serializeQuestion(answeredQuestion),
    nextQuestion: serializeQuestion(nextQuestion),
    completed: false,
  };
}

// Generates the final interview report and marks the session complete.
// Idempotent: calling this again on an already-completed session simply
// returns the stored report instead of re-running the AI call.
export async function endInterview(
  resumeId: string,
  interviewId: string,
  userId: string,
): Promise<EndInterviewReply> {
  await getOwnedResumeOrThrow(resumeId, userId);
  const session = await getOwnedInterviewSessionOrThrow(resumeId, interviewId, userId);

  const questions = await prisma.interviewQuestion.findMany({
    where: { interviewSessionId: interviewId },
    orderBy: { order: "asc" },
  });

  if (session.status === "COMPLETED") {
    return {
      session: {
        ...serializeSession(session),
        questions: questions.map(serializeQuestion),
        finalReport: session.finalReport
          ? (JSON.parse(session.finalReport) as InterviewReport)
          : null,
      },
    };
  }

  const answered = questions.filter((q) => q.userAnswer && q.score !== null);
  if (answered.length === 0) {
    throw new InterviewServiceError(
      "Answer at least one question before ending the interview.",
      422,
    );
  }

  const sections = await loadInterviewSections(resumeId, userId, session.versionId ?? undefined);
  const resumeContext = buildResumeContext(sections);

  const template = getPrompt("INTERVIEW_REPORT");
  const aiOutput = await generateAIJSON({
    feature: "INTERVIEW_REPORT",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({
      resumeContext,
      interviewType: session.interviewType,
      transcriptContext: buildTranscriptContext(questions),
    }),
    schema: interviewReportAIOutputSchema,
  });

  const overallScore = Math.round(
    answered.reduce((sum, q) => sum + (q.score ?? 0), 0) / answered.length,
  );
  const completedAt = new Date();
  const duration = Math.max(
    0,
    Math.round((completedAt.getTime() - session.startedAt.getTime()) / 1000),
  );

  const finalReport: InterviewReport = {
    ...aiOutput,
    overallScore,
    interviewType: session.interviewType as InterviewType,
    questionCount: answered.length,
    hiringReadiness: aiOutput.hiringReadiness,
  };

  const updated = await prisma.interviewSession.update({
    where: { id: interviewId },
    data: {
      status: "COMPLETED",
      completedAt,
      duration,
      overallScore,
      finalReport: JSON.stringify(finalReport),
    },
  });

  return {
    session: {
      ...serializeSession(updated),
      questions: questions.map(serializeQuestion),
      finalReport,
    },
  };
}

export async function listInterviewsForResume(
  resumeId: string,
  userId: string,
): Promise<InterviewSessionListItem[]> {
  await getOwnedResumeOrThrow(resumeId, userId);

  const sessions = await prisma.interviewSession.findMany({
    where: { resumeId, userId },
    orderBy: { startedAt: "desc" },
  });

  return sessions.map(serializeSession);
}

export async function getInterviewForResume(
  resumeId: string,
  interviewId: string,
  userId: string,
): Promise<InterviewSessionItem> {
  await getOwnedResumeOrThrow(resumeId, userId);
  const session = await getOwnedInterviewSessionOrThrow(resumeId, interviewId, userId);

  const questions = await prisma.interviewQuestion.findMany({
    where: { interviewSessionId: interviewId },
    orderBy: { order: "asc" },
  });

  return {
    ...serializeSession(session),
    questions: questions.map(serializeQuestion),
    finalReport: session.finalReport
      ? (JSON.parse(session.finalReport) as InterviewReport)
      : null,
  };
}

export async function abandonInterview(
  resumeId: string,
  interviewId: string,
  userId: string,
): Promise<void> {
  await getOwnedResumeOrThrow(resumeId, userId);
  const session = await getOwnedInterviewSessionOrThrow(resumeId, interviewId, userId);

  if (session.status !== "IN_PROGRESS") {
    throw new InterviewServiceError("This interview has already ended.", 409);
  }

  await prisma.interviewSession.update({
    where: { id: interviewId },
    data: { status: "ABANDONED", completedAt: new Date() },
  });
}
