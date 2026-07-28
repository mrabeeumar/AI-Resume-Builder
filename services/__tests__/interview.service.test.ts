import { beforeEach, describe, expect, it, vi } from "vitest";

const generateAIJSONMock = vi.fn();
vi.mock("@/services/ai.service", () => ({
  generateAIJSON: (...args: unknown[]) => generateAIJSONMock(...args),
}));

const getOwnedResumeOrThrowMock = vi.fn();
vi.mock("@/services/resume.service", () => ({
  getOwnedResumeOrThrow: (...args: unknown[]) => getOwnedResumeOrThrowMock(...args),
  ResumeServiceError: class ResumeServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
      super(message);
      this.status = status;
    }
  },
}));

const getOwnedJobDescriptionOrThrowMock = vi.fn();
vi.mock("@/services/job-description.service", () => ({
  getOwnedJobDescriptionOrThrow: (...args: unknown[]) =>
    getOwnedJobDescriptionOrThrowMock(...args),
}));

const getOwnedCoverLetterOrThrowMock = vi.fn();
vi.mock("@/services/cover-letter.service", () => ({
  getOwnedCoverLetterOrThrow: (...args: unknown[]) =>
    getOwnedCoverLetterOrThrowMock(...args),
}));

const getVersionForResumeMock = vi.fn();
vi.mock("@/services/resume-version.service", () => ({
  getVersionForResume: (...args: unknown[]) => getVersionForResumeMock(...args),
}));

const resumeSectionFindManyMock = vi.fn();
const interviewSessionCreateMock = vi.fn();
const interviewSessionFindUniqueMock = vi.fn();
const interviewSessionFindManyMock = vi.fn();
const interviewSessionUpdateMock = vi.fn();
const interviewQuestionCreateMock = vi.fn();
const interviewQuestionFindManyMock = vi.fn();
const interviewQuestionFindFirstMock = vi.fn();
const interviewQuestionUpdateMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    resumeSection: { findMany: (...args: unknown[]) => resumeSectionFindManyMock(...args) },
    interviewSession: {
      create: (...args: unknown[]) => interviewSessionCreateMock(...args),
      findUnique: (...args: unknown[]) => interviewSessionFindUniqueMock(...args),
      findMany: (...args: unknown[]) => interviewSessionFindManyMock(...args),
      update: (...args: unknown[]) => interviewSessionUpdateMock(...args),
    },
    interviewQuestion: {
      create: (...args: unknown[]) => interviewQuestionCreateMock(...args),
      findMany: (...args: unknown[]) => interviewQuestionFindManyMock(...args),
      findFirst: (...args: unknown[]) => interviewQuestionFindFirstMock(...args),
      update: (...args: unknown[]) => interviewQuestionUpdateMock(...args),
    },
  },
  createWithSequenceRetry: async <T>(attempt: () => Promise<T>) => attempt(),
}));

const {
  startInterview,
  submitInterviewAnswer,
  endInterview,
  listInterviewsForResume,
  getInterviewForResume,
} = await import("@/services/interview.service");

function dbSections() {
  return [
    {
      id: "sec-summary",
      resumeId: "resume-1",
      type: "SUMMARY",
      order: 0,
      hidden: false,
      content: JSON.stringify({ text: "Experienced engineer." }),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "sec-skills",
      resumeId: "resume-1",
      type: "SKILLS",
      order: 1,
      hidden: false,
      content: JSON.stringify({ items: ["React", "TypeScript"] }),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

function questionAIOutput(overrides: Record<string, unknown> = {}) {
  return {
    greeting: "Welcome! Let's get started.",
    question: "Tell me about a challenging project you worked on.",
    category: "TECHNICAL",
    difficulty: "MEDIUM",
    resumeSection: "PROJECTS",
    expectedSkills: ["React"],
    relatedProject: "",
    estimatedAnswerSeconds: 120,
    ...overrides,
  };
}

function evaluationAIOutput(overrides: Record<string, unknown> = {}) {
  return {
    technicalAccuracy: 80,
    completeness: 75,
    communication: 85,
    confidence: 70,
    relevance: 90,
    practicalThinking: 78,
    overallScore: 80,
    strengths: ["Clear explanation"],
    weaknesses: [],
    missingPoints: [],
    idealAnswer: "A thorough answer would...",
    improvementSuggestions: [],
    feedback: "Solid answer overall.",
    ...overrides,
  };
}

function reportAIOutput(overrides: Record<string, unknown> = {}) {
  return {
    technicalScore: 80,
    communicationScore: 85,
    confidenceScore: 70,
    behavioralScore: 75,
    strengths: ["Strong technical depth"],
    weaknesses: ["Could be more concise"],
    frequentlyMissedTopics: [],
    improvementPlan: {
      topicsToStudy: ["System design"],
      projectsToImprove: [],
      practiceAreas: ["Behavioral questions"],
    },
    hiringReadiness: "STRONG_CANDIDATE",
    summary: "A strong candidate overall.",
    ...overrides,
  };
}

function dbQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: "question-1",
    interviewSessionId: "interview-1",
    order: 1,
    question: "Tell me about a challenging project you worked on.",
    category: "TECHNICAL",
    difficulty: "MEDIUM",
    resumeSection: "PROJECTS",
    expectedSkills: JSON.stringify(["React"]),
    relatedProject: null,
    estimatedAnswerSeconds: 120,
    userAnswer: null,
    aiEvaluation: null,
    score: null,
    createdAt: new Date(),
    answeredAt: null,
    ...overrides,
  };
}

function dbSession(overrides: Record<string, unknown> = {}) {
  return {
    id: "interview-1",
    userId: "user-1",
    resumeId: "resume-1",
    versionId: null,
    jobDescriptionId: null,
    coverLetterId: null,
    interviewType: "TECHNICAL",
    difficulty: "MEDIUM",
    questionCount: 5,
    feedbackMode: "AFTER_EACH_QUESTION",
    status: "IN_PROGRESS",
    startedAt: new Date(),
    completedAt: null,
    duration: null,
    overallScore: null,
    finalReport: null,
    ...overrides,
  };
}

describe("startInterview", () => {
  beforeEach(() => {
    generateAIJSONMock.mockReset();
    getOwnedResumeOrThrowMock.mockReset();
    resumeSectionFindManyMock.mockReset();
    interviewSessionCreateMock.mockReset();
    interviewQuestionCreateMock.mockReset();

    getOwnedResumeOrThrowMock.mockResolvedValue({ id: "resume-1", userId: "user-1" });
    resumeSectionFindManyMock.mockResolvedValue(dbSections());
    generateAIJSONMock.mockResolvedValue(questionAIOutput());
    interviewSessionCreateMock.mockImplementation(({ data }) =>
      Promise.resolve(dbSession(data)),
    );
    interviewQuestionCreateMock.mockImplementation(({ data }) =>
      Promise.resolve(dbQuestion(data)),
    );
  });

  it("creates a session and its first question, returning the greeting", async () => {
    const reply = await startInterview("resume-1", "user-1", {
      interviewType: "TECHNICAL",
      difficulty: "MEDIUM",
      questionCount: 5,
      feedbackMode: "AFTER_EACH_QUESTION",
    });

    expect(getOwnedResumeOrThrowMock).toHaveBeenCalledWith("resume-1", "user-1");
    expect(interviewSessionCreateMock).toHaveBeenCalledTimes(1);
    expect(reply.greeting).toBe("Welcome! Let's get started.");
    expect(reply.firstQuestion.order).toBe(1);
    expect(reply.firstQuestion.expectedSkills).toEqual(["React"]);
  });

  it("resolves an optional saved job description into context", async () => {
    getOwnedJobDescriptionOrThrowMock.mockResolvedValue({
      id: "job-1",
      title: "Senior Engineer",
      company: "Acme",
      content: "We need a senior engineer.",
    });

    await startInterview("resume-1", "user-1", {
      interviewType: "TECHNICAL",
      difficulty: "MEDIUM",
      questionCount: 5,
      feedbackMode: "AFTER_EACH_QUESTION",
      jobDescriptionId: "job-1",
    });

    expect(getOwnedJobDescriptionOrThrowMock).toHaveBeenCalledWith("job-1", "user-1");
  });
});

describe("submitInterviewAnswer", () => {
  beforeEach(() => {
    generateAIJSONMock.mockReset();
    getOwnedResumeOrThrowMock.mockReset();
    resumeSectionFindManyMock.mockReset();
    interviewSessionFindUniqueMock.mockReset();
    interviewQuestionFindManyMock.mockReset();
    interviewQuestionFindFirstMock.mockReset();
    interviewQuestionUpdateMock.mockReset();
    interviewQuestionCreateMock.mockReset();

    getOwnedResumeOrThrowMock.mockResolvedValue({ id: "resume-1", userId: "user-1" });
    resumeSectionFindManyMock.mockResolvedValue(dbSections());
    interviewSessionFindUniqueMock.mockResolvedValue(dbSession());
    interviewQuestionFindFirstMock.mockResolvedValue(dbQuestion());
    interviewQuestionUpdateMock.mockImplementation(({ where, data }) =>
      Promise.resolve(dbQuestion({ id: where.id, ...data })),
    );
    interviewQuestionCreateMock.mockImplementation(({ data }) =>
      Promise.resolve(dbQuestion(data)),
    );
  });

  it("evaluates the open question and generates the next one when under the limit", async () => {
    interviewQuestionFindManyMock.mockResolvedValue([dbQuestion()]);
    generateAIJSONMock
      .mockResolvedValueOnce(evaluationAIOutput())
      .mockResolvedValueOnce(questionAIOutput({ question: "Follow-up question." }));

    const reply = await submitInterviewAnswer("resume-1", "interview-1", "user-1", {
      answer: "I worked on a distributed caching layer.",
    });

    expect(reply.completed).toBe(false);
    expect(reply.evaluatedQuestion.score).toBe(80);
    expect(reply.nextQuestion?.order).toBe(2);
    expect(interviewQuestionCreateMock).toHaveBeenCalledTimes(1);
  });

  it("marks the interview completed without generating another question at the limit", async () => {
    interviewSessionFindUniqueMock.mockResolvedValue(dbSession({ questionCount: 1 }));
    interviewQuestionFindManyMock.mockResolvedValue([dbQuestion()]);
    generateAIJSONMock.mockResolvedValueOnce(evaluationAIOutput());

    const reply = await submitInterviewAnswer("resume-1", "interview-1", "user-1", {
      answer: "I worked on a distributed caching layer.",
    });

    expect(reply.completed).toBe(true);
    expect(reply.nextQuestion).toBeNull();
    expect(interviewQuestionCreateMock).not.toHaveBeenCalled();
    expect(generateAIJSONMock).toHaveBeenCalledTimes(1);
  });

  it("rejects answers once the interview has already ended", async () => {
    interviewSessionFindUniqueMock.mockResolvedValue(dbSession({ status: "COMPLETED" }));

    await expect(
      submitInterviewAnswer("resume-1", "interview-1", "user-1", { answer: "Anything." }),
    ).rejects.toThrow("already ended");
  });

  it("rejects when there is no open question left to answer", async () => {
    interviewQuestionFindManyMock.mockResolvedValue([
      dbQuestion({ userAnswer: "Already answered." }),
    ]);

    await expect(
      submitInterviewAnswer("resume-1", "interview-1", "user-1", { answer: "Anything." }),
    ).rejects.toThrow("no open question");
  });
});

describe("endInterview", () => {
  beforeEach(() => {
    generateAIJSONMock.mockReset();
    getOwnedResumeOrThrowMock.mockReset();
    resumeSectionFindManyMock.mockReset();
    interviewSessionFindUniqueMock.mockReset();
    interviewSessionUpdateMock.mockReset();
    interviewQuestionFindManyMock.mockReset();

    getOwnedResumeOrThrowMock.mockResolvedValue({ id: "resume-1", userId: "user-1" });
    resumeSectionFindManyMock.mockResolvedValue(dbSections());
  });

  it("computes the overall score as the average of answered questions and persists the report", async () => {
    interviewSessionFindUniqueMock.mockResolvedValue(dbSession());
    interviewQuestionFindManyMock.mockResolvedValue([
      dbQuestion({
        id: "q1",
        userAnswer: "Answer 1",
        aiEvaluation: JSON.stringify(evaluationAIOutput()),
        score: 80,
      }),
      dbQuestion({
        id: "q2",
        order: 2,
        userAnswer: "Answer 2",
        aiEvaluation: JSON.stringify(evaluationAIOutput({ overallScore: 60 })),
        score: 60,
      }),
    ]);
    generateAIJSONMock.mockResolvedValue(reportAIOutput());
    interviewSessionUpdateMock.mockImplementation(({ data }) =>
      Promise.resolve(dbSession(data)),
    );

    const reply = await endInterview("resume-1", "interview-1", "user-1");

    expect(reply.session.overallScore).toBe(70);
    expect(reply.session.finalReport?.hiringReadiness).toBe("STRONG_CANDIDATE");
    expect(interviewSessionUpdateMock).toHaveBeenCalledTimes(1);
  });

  it("throws when no question has been answered yet", async () => {
    interviewSessionFindUniqueMock.mockResolvedValue(dbSession());
    interviewQuestionFindManyMock.mockResolvedValue([dbQuestion()]);

    await expect(endInterview("resume-1", "interview-1", "user-1")).rejects.toThrow(
      "Answer at least one question",
    );
  });

  it("is idempotent: returns the stored report without re-running AI for a completed session", async () => {
    const report = {
      ...reportAIOutput(),
      overallScore: 75,
      interviewType: "TECHNICAL",
      questionCount: 1,
    };
    interviewSessionFindUniqueMock.mockResolvedValue(
      dbSession({ status: "COMPLETED", overallScore: 75, finalReport: JSON.stringify(report) }),
    );
    interviewQuestionFindManyMock.mockResolvedValue([
      dbQuestion({ userAnswer: "Answer 1", score: 75 }),
    ]);

    const reply = await endInterview("resume-1", "interview-1", "user-1");

    expect(reply.session.overallScore).toBe(75);
    expect(generateAIJSONMock).not.toHaveBeenCalled();
    expect(interviewSessionUpdateMock).not.toHaveBeenCalled();
  });
});

describe("interview history", () => {
  beforeEach(() => {
    getOwnedResumeOrThrowMock.mockReset();
    interviewSessionFindManyMock.mockReset();
    interviewSessionFindUniqueMock.mockReset();
    interviewQuestionFindManyMock.mockReset();

    getOwnedResumeOrThrowMock.mockResolvedValue({ id: "resume-1", userId: "user-1" });
  });

  it("lists sessions only for the owning user's resume", async () => {
    interviewSessionFindManyMock.mockResolvedValue([dbSession()]);

    const sessions = await listInterviewsForResume("resume-1", "user-1");

    expect(getOwnedResumeOrThrowMock).toHaveBeenCalledWith("resume-1", "user-1");
    expect(sessions).toHaveLength(1);
  });

  it("throws when fetching a session that belongs to a different resume", async () => {
    interviewSessionFindUniqueMock.mockResolvedValue(dbSession({ resumeId: "other-resume" }));

    await expect(
      getInterviewForResume("resume-1", "interview-1", "user-1"),
    ).rejects.toThrow("Interview session not found.");
  });
});
