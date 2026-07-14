import { beforeEach, describe, expect, it, vi } from "vitest";

const generateAIJSONMock = vi.fn();
vi.mock("@/services/ai.service", () => ({
  generateAIJSON: (...args: unknown[]) => generateAIJSONMock(...args),
}));

const parseJobDescriptionMock = vi.fn();
vi.mock("@/services/job-parser.service", () => ({
  parseJobDescription: (...args: unknown[]) => parseJobDescriptionMock(...args),
}));

const getOwnedJobDescriptionOrThrowMock = vi.fn();
vi.mock("@/services/job-description.service", () => ({
  getOwnedJobDescriptionOrThrow: (...args: unknown[]) =>
    getOwnedJobDescriptionOrThrowMock(...args),
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

const getVersionForResumeMock = vi.fn();
vi.mock("@/services/resume-version.service", () => ({
  getVersionForResume: (...args: unknown[]) => getVersionForResumeMock(...args),
}));

const resumeSectionFindManyMock = vi.fn();
const skillGapAnalysisCreateMock = vi.fn();
const skillGapAnalysisFindManyMock = vi.fn();
const skillGapAnalysisFindUniqueMock = vi.fn();
const skillGapAnalysisDeleteMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    resumeSection: { findMany: (...args: unknown[]) => resumeSectionFindManyMock(...args) },
    skillGapAnalysis: {
      create: (...args: unknown[]) => skillGapAnalysisCreateMock(...args),
      findMany: (...args: unknown[]) => skillGapAnalysisFindManyMock(...args),
      findUnique: (...args: unknown[]) => skillGapAnalysisFindUniqueMock(...args),
      delete: (...args: unknown[]) => skillGapAnalysisDeleteMock(...args),
    },
  },
}));

const {
  generateSkillGapAnalysis,
  listSkillGapAnalysesForResume,
  getSkillGapAnalysisForResume,
  deleteSkillGapAnalysisForResume,
} = await import("@/services/skill-gap-analysis.service");

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
            description: "Built things with React.",
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

function jobAnalysis(overrides: Record<string, unknown> = {}) {
  return {
    company: { name: "Acme", industry: "", location: "" },
    position: {
      title: "Senior Engineer",
      department: "",
      employmentType: "",
      experienceRequired: "",
      educationRequired: "",
    },
    responsibilities: [],
    requiredSkills: {
      technical: ["React", "TypeScript"],
      programmingLanguages: [],
      frameworks: [],
      tools: [],
      softSkills: [],
    },
    preferredSkills: [],
    keywords: [],
    technologies: {
      languages: [],
      frameworks: [],
      databases: [],
      cloudPlatforms: [],
      devopsTools: [],
      other: [],
    },
    confidence: { overall: 80 },
    ...overrides,
  };
}

function aiOutput(overrides: Record<string, unknown> = {}) {
  return {
    missingSkills: {
      technical: ["TypeScript"],
      softSkills: [],
      tools: [],
      frameworks: [],
      languages: [],
      databases: [],
      cloudTechnologies: [],
    },
    experience: {
      relevantExperience: ["Built things with React."],
      missingExperience: [],
      experienceLevelMatch: "Meets requirements",
      domainMatch: "Strong",
      projectRelevance: "Relevant",
    },
    education: {
      degreeRequirementsMet: true,
      missingCertifications: [],
      additionalQualificationsNeeded: [],
      notes: "",
    },
    roadmap: {
      skillsToLearnFirst: ["TypeScript"],
      suggestedTechnologies: [],
      recommendedCertifications: [],
      portfolioProjectIdeas: [],
      resumeImprovementSuggestions: [],
    },
    strengths: {
      existingStrengths: ["Strong React experience"],
      competitiveAdvantages: [],
      relevantExperienceHighlights: [],
    },
    summary: "Good overall fit.",
    ...overrides,
  };
}

describe("generateSkillGapAnalysis", () => {
  beforeEach(() => {
    generateAIJSONMock.mockReset();
    parseJobDescriptionMock.mockReset();
    getOwnedJobDescriptionOrThrowMock.mockReset();
    getOwnedResumeOrThrowMock.mockReset();
    getVersionForResumeMock.mockReset();
    resumeSectionFindManyMock.mockReset();
    skillGapAnalysisCreateMock.mockReset();

    getOwnedResumeOrThrowMock.mockResolvedValue({
      id: "resume-1",
      userId: "user-1",
      title: "My Resume",
      status: "DRAFT",
    });
    resumeSectionFindManyMock.mockResolvedValue(dbSections());
    parseJobDescriptionMock.mockResolvedValue(jobAnalysis());
    generateAIJSONMock.mockResolvedValue(aiOutput());
    skillGapAnalysisCreateMock.mockImplementation(({ data }) =>
      Promise.resolve({
        id: "analysis-1",
        resumeId: data.resumeId,
        versionId: data.versionId,
        jobDescriptionId: data.jobDescriptionId,
        overallScore: data.overallScore,
        content: data.content,
        createdAt: new Date(),
      }),
    );
  });

  it("requires a job description source", async () => {
    await expect(
      generateSkillGapAnalysis("resume-1", "user-1", {}),
    ).rejects.toThrow("A job description");
  });

  it("computes match scores from deterministic skill matching and AI education analysis", async () => {
    const result = await generateSkillGapAnalysis("resume-1", "user-1", {
      jobDescription: "We need a senior engineer with React and TypeScript.",
    });

    expect(result.content.scores.skillsMatchScore).toBeGreaterThanOrEqual(0);
    expect(result.content.scores.educationMatchScore).toBe(100);
    expect(result.content.scores.overallScore).toBe(result.overallScore);
  });

  it("persists the analysis and returns the categorized missing skills", async () => {
    const result = await generateSkillGapAnalysis("resume-1", "user-1", {
      jobDescription: "We need a senior engineer with React and TypeScript.",
    });

    expect(skillGapAnalysisCreateMock).toHaveBeenCalledTimes(1);
    expect(result.content.missingSkills.technical).toContain("TypeScript");
    expect(result.content.jobTitle).toBe("Senior Engineer");
  });

  it("penalizes the education score when degree requirements are not met", async () => {
    generateAIJSONMock.mockResolvedValue(
      aiOutput({
        education: {
          degreeRequirementsMet: false,
          missingCertifications: ["AWS Certified"],
          additionalQualificationsNeeded: [],
          notes: "Missing a degree.",
        },
      }),
    );

    const result = await generateSkillGapAnalysis("resume-1", "user-1", {
      jobDescription: "We need a senior engineer with React and TypeScript.",
    });

    expect(result.content.scores.educationMatchScore).toBeLessThan(100);
  });

  it("analyzes a specific past version when versionId is provided", async () => {
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

    await generateSkillGapAnalysis("resume-1", "user-1", {
      jobDescription: "We need a senior engineer with React and TypeScript.",
      versionId: "version-1",
    });

    expect(getVersionForResumeMock).toHaveBeenCalledWith(
      "resume-1",
      "version-1",
      "user-1",
    );
    expect(resumeSectionFindManyMock).not.toHaveBeenCalled();
  });

  it("uses a saved job description's title and content when jobDescriptionId is provided", async () => {
    getOwnedJobDescriptionOrThrowMock.mockResolvedValue({
      id: "job-1",
      title: "Staff Engineer",
      content: "Staff engineer role requiring React and TypeScript.",
    });

    const result = await generateSkillGapAnalysis("resume-1", "user-1", {
      jobDescriptionId: "job-1",
    });

    expect(getOwnedJobDescriptionOrThrowMock).toHaveBeenCalledWith(
      "job-1",
      "user-1",
    );
    expect(result.content.jobDescriptionId).toBe("job-1");
  });
});

describe("skill gap analysis history", () => {
  beforeEach(() => {
    getOwnedResumeOrThrowMock.mockReset();
    skillGapAnalysisFindManyMock.mockReset();
    skillGapAnalysisFindUniqueMock.mockReset();
    skillGapAnalysisDeleteMock.mockReset();

    getOwnedResumeOrThrowMock.mockResolvedValue({
      id: "resume-1",
      userId: "user-1",
    });
  });

  it("lists analyses only for the owning user's resume", async () => {
    skillGapAnalysisFindManyMock.mockResolvedValue([
      {
        id: "analysis-1",
        resumeId: "resume-1",
        versionId: null,
        jobDescriptionId: null,
        overallScore: 80,
        createdAt: new Date(),
      },
    ]);

    const analyses = await listSkillGapAnalysesForResume("resume-1", "user-1");

    expect(getOwnedResumeOrThrowMock).toHaveBeenCalledWith("resume-1", "user-1");
    expect(analyses).toHaveLength(1);
  });

  it("throws when fetching an analysis that belongs to a different resume", async () => {
    skillGapAnalysisFindUniqueMock.mockResolvedValue({
      id: "analysis-1",
      resumeId: "other-resume",
      versionId: null,
      jobDescriptionId: null,
      overallScore: 80,
      content: "{}",
      createdAt: new Date(),
    });

    await expect(
      getSkillGapAnalysisForResume("resume-1", "analysis-1", "user-1"),
    ).rejects.toThrow("Skill gap analysis not found.");
  });

  it("deletes an analysis that belongs to the owning resume", async () => {
    skillGapAnalysisFindUniqueMock.mockResolvedValue({
      id: "analysis-1",
      resumeId: "resume-1",
      versionId: null,
      jobDescriptionId: null,
      overallScore: 80,
      content: "{}",
      createdAt: new Date(),
    });

    await deleteSkillGapAnalysisForResume("resume-1", "analysis-1", "user-1");

    expect(skillGapAnalysisDeleteMock).toHaveBeenCalledWith({
      where: { id: "analysis-1" },
    });
  });
});
