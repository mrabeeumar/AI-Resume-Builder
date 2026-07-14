import { beforeEach, describe, expect, it, vi } from "vitest";

const generateAIJSONMock = vi.fn();
vi.mock("@/services/ai.service", () => ({
  generateAIJSON: (...args: unknown[]) => generateAIJSONMock(...args),
}));

const analyzeAtsMock = vi.fn();
vi.mock("@/services/ats.service", () => ({
  analyzeAts: (...args: unknown[]) => analyzeAtsMock(...args),
}));

const getOwnedResumeOrThrowMock = vi.fn();
vi.mock("@/services/resume.service", () => ({
  getOwnedResumeOrThrow: (...args: unknown[]) =>
    getOwnedResumeOrThrowMock(...args),
  ResumeServiceError: class ResumeServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
      super(message);
      this.status = status;
    }
  },
}));

const getVersionForResumeMock = vi.fn();
vi.mock("@/services/resume-version.service", () => ({
  getVersionForResume: (...args: unknown[]) => getVersionForResumeMock(...args),
}));

const resumeSectionFindManyMock = vi.fn();
const resumeReviewCreateMock = vi.fn();
const resumeReviewFindManyMock = vi.fn();
const resumeReviewFindUniqueMock = vi.fn();
const resumeReviewDeleteMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    resumeSection: { findMany: (...args: unknown[]) => resumeSectionFindManyMock(...args) },
    resumeReview: {
      create: (...args: unknown[]) => resumeReviewCreateMock(...args),
      findMany: (...args: unknown[]) => resumeReviewFindManyMock(...args),
      findUnique: (...args: unknown[]) => resumeReviewFindUniqueMock(...args),
      delete: (...args: unknown[]) => resumeReviewDeleteMock(...args),
    },
  },
}));

const {
  generateResumeReview,
  listReviewsForResume,
  getReviewForResume,
  deleteReviewForResume,
} = await import("@/services/resume-review.service");

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
      id: "sec-experience",
      resumeId: "resume-1",
      type: "EXPERIENCE",
      order: 1,
      hidden: false,
      content: JSON.stringify({
        items: [
          {
            id: "exp-1",
            company: "Acme",
            role: "Engineer",
            location: "",
            startDate: "2020",
            endDate: "2022",
            current: false,
            description: "Built things.",
          },
        ],
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "sec-skills",
      resumeId: "resume-1",
      type: "SKILLS",
      order: 2,
      hidden: false,
      content: JSON.stringify({ items: ["React"] }),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

function aiOutput(overrides: Record<string, unknown> = {}) {
  return {
    scores: { content: 70, readability: 80, grammar: 90, experience: 60 },
    sections: [{ section: "Summary", status: "STRONG", notes: "Good." }],
    content: { strengths: ["Clear"], weaknesses: [], suggestions: [] },
    experience: { strengths: [], weaknesses: ["Thin"], suggestions: ["Add metrics"] },
    skills: { strengths: [], weaknesses: [], suggestions: [], missingSkills: ["TypeScript"] },
    projects: { strengths: [], weaknesses: [], suggestions: [] },
    education: { strengths: [], weaknesses: [], suggestions: [] },
    grammar: { issues: [], tone: "Professional" },
    recommendations: [
      { priority: "HIGH", problem: "Missing education", reason: "ATS penalizes it", suggestion: "Add education" },
    ],
    ...overrides,
  };
}

function atsReport(overrides: Record<string, unknown> = {}) {
  return {
    overallScore: 75,
    keywordScore: 70,
    skillsScore: 80,
    readabilityScore: 85,
    jobMatchScore: null,
    missingKeywords: [],
    suggestions: [],
    missingSections: [],
    ...overrides,
  };
}

describe("generateResumeReview", () => {
  beforeEach(() => {
    generateAIJSONMock.mockReset();
    analyzeAtsMock.mockReset();
    getOwnedResumeOrThrowMock.mockReset();
    getVersionForResumeMock.mockReset();
    resumeSectionFindManyMock.mockReset();
    resumeReviewCreateMock.mockReset();

    getOwnedResumeOrThrowMock.mockResolvedValue({
      id: "resume-1",
      userId: "user-1",
      title: "My Resume",
      status: "DRAFT",
    });
    resumeSectionFindManyMock.mockResolvedValue(dbSections());
    analyzeAtsMock.mockResolvedValue(atsReport());
    generateAIJSONMock.mockResolvedValue(aiOutput());
    resumeReviewCreateMock.mockImplementation(({ data }) =>
      Promise.resolve({
        id: "review-1",
        resumeId: data.resumeId,
        versionId: data.versionId,
        overallScore: data.overallScore,
        content: data.content,
        createdAt: new Date(),
      }),
    );
  });

  it("computes education as a missing core section only when relevant", async () => {
    const result = await generateResumeReview("resume-1", "user-1", {});

    expect(result.content.missingSections).toContain("EDUCATION");
    expect(result.content.missingSections).not.toContain("SUMMARY");
    expect(result.content.missingSections).not.toContain("EXPERIENCE");
    expect(result.content.missingSections).not.toContain("SKILLS");
  });

  it("combines AI scores and the ATS score into an overall score", async () => {
    const result = await generateResumeReview("resume-1", "user-1", {});

    expect(result.content.scores.ats).toBe(75);
    expect(result.content.scores.overall).toBe(
      Math.round((70 + 80 + 90 + 60 + 75) / 5),
    );
    expect(result.overallScore).toBe(result.content.scores.overall);
  });

  it("persists the review and returns the stored report", async () => {
    const result = await generateResumeReview("resume-1", "user-1", {});

    expect(resumeReviewCreateMock).toHaveBeenCalledTimes(1);
    expect(result.content.recommendations[0].priority).toBe("HIGH");
    expect(result.content.ats.overallScore).toBe(75);
  });

  it("reviews a specific past version when versionId is provided", async () => {
    getVersionForResumeMock.mockResolvedValue({
      content: {
        title: "My Resume",
        status: "DRAFT",
        sections: dbSections().map((s) => ({
          type: s.type,
          order: s.order,
          hidden: s.hidden,
          content: JSON.parse(s.content),
        })),
      },
    });

    await generateResumeReview("resume-1", "user-1", { versionId: "version-1" });

    expect(getVersionForResumeMock).toHaveBeenCalledWith(
      "resume-1",
      "version-1",
      "user-1",
    );
    expect(resumeSectionFindManyMock).not.toHaveBeenCalled();
  });
});

describe("review history", () => {
  beforeEach(() => {
    getOwnedResumeOrThrowMock.mockReset();
    resumeReviewFindManyMock.mockReset();
    resumeReviewFindUniqueMock.mockReset();
    resumeReviewDeleteMock.mockReset();

    getOwnedResumeOrThrowMock.mockResolvedValue({
      id: "resume-1",
      userId: "user-1",
    });
  });

  it("lists reviews only for the owning user's resume", async () => {
    resumeReviewFindManyMock.mockResolvedValue([
      { id: "review-1", resumeId: "resume-1", versionId: null, overallScore: 80, createdAt: new Date() },
    ]);

    const reviews = await listReviewsForResume("resume-1", "user-1");

    expect(getOwnedResumeOrThrowMock).toHaveBeenCalledWith("resume-1", "user-1");
    expect(reviews).toHaveLength(1);
  });

  it("throws when fetching a review that belongs to a different resume", async () => {
    resumeReviewFindUniqueMock.mockResolvedValue({
      id: "review-1",
      resumeId: "other-resume",
      versionId: null,
      overallScore: 80,
      content: "{}",
      createdAt: new Date(),
    });

    await expect(
      getReviewForResume("resume-1", "review-1", "user-1"),
    ).rejects.toThrow("Review not found.");
  });

  it("deletes a review that belongs to the owning resume", async () => {
    resumeReviewFindUniqueMock.mockResolvedValue({
      id: "review-1",
      resumeId: "resume-1",
      versionId: null,
      overallScore: 80,
      content: "{}",
      createdAt: new Date(),
    });

    await deleteReviewForResume("resume-1", "review-1", "user-1");

    expect(resumeReviewDeleteMock).toHaveBeenCalledWith({
      where: { id: "review-1" },
    });
  });
});
