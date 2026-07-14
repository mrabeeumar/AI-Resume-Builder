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
const compareVersionsMock = vi.fn();
vi.mock("@/services/resume-version.service", () => ({
  getVersionForResume: (...args: unknown[]) => getVersionForResumeMock(...args),
  compareVersions: (...args: unknown[]) => compareVersionsMock(...args),
}));

const resumeSectionFindManyMock = vi.fn();
const resumeVersionFindFirstMock = vi.fn();
const resumeVersionCreateMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    resumeSection: { findMany: (...args: unknown[]) => resumeSectionFindManyMock(...args) },
    resumeVersion: {
      findFirst: (...args: unknown[]) => resumeVersionFindFirstMock(...args),
      create: (...args: unknown[]) => resumeVersionCreateMock(...args),
    },
  },
}));

const { generateTailoredResume, saveTailoredResume, ResumeTailoringServiceError } =
  await import("@/services/resume-tailoring.service");

function jobAnalysis() {
  return {
    company: { name: "Acme", industry: "", location: "" },
    position: { title: "Senior Engineer", department: "", employmentType: "", experienceRequired: "", educationRequired: "" },
    responsibilities: [],
    requiredSkills: { technical: ["React"], programmingLanguages: [], frameworks: [], tools: [], softSkills: [] },
    preferredSkills: [],
    keywords: [{ keyword: "React", importance: 8 }],
    technologies: { languages: [], frameworks: [], databases: [], cloudPlatforms: [], devopsTools: [], other: [] },
    salary: "",
    workMode: "",
    applicationDeadline: "",
    confidence: { overall: 80, sections: {}, lowConfidenceFields: [] },
  };
}

function dbSections() {
  return [
    {
      id: "sec-summary",
      resumeId: "resume-1",
      type: "SUMMARY",
      order: 0,
      hidden: false,
      content: JSON.stringify({ text: "Old summary" }),
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
      content: JSON.stringify({ items: ["React", "Node.js"] }),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

function aiOutput(overrides: Record<string, unknown> = {}) {
  return {
    summary: "Tailored summary",
    experience: [{ id: "exp-1", description: "Built React features." }],
    skills: ["React"],
    projects: [],
    highlightedCertificationIds: [],
    sectionsModified: ["SUMMARY"],
    keywordsIncorporated: ["React"],
    missingSkillsIdentified: [],
    recommendations: ["Mention React more"],
    overallImprovements: ["Improved summary"],
    ...overrides,
  };
}

describe("generateTailoredResume", () => {
  beforeEach(() => {
    generateAIJSONMock.mockReset();
    parseJobDescriptionMock.mockReset();
    getOwnedJobDescriptionOrThrowMock.mockReset();
    getOwnedResumeOrThrowMock.mockReset();
    getVersionForResumeMock.mockReset();
    resumeSectionFindManyMock.mockReset();
    resumeVersionFindFirstMock.mockReset();
    resumeVersionCreateMock.mockReset();

    getOwnedResumeOrThrowMock.mockResolvedValue({
      id: "resume-1",
      userId: "user-1",
      title: "My Resume",
      status: "DRAFT",
    });
    resumeSectionFindManyMock.mockResolvedValue(dbSections());
  });

  it("requires a job description source", async () => {
    await expect(
      generateTailoredResume("resume-1", "user-1", {}),
    ).rejects.toThrow(ResumeTailoringServiceError);
    expect(parseJobDescriptionMock).not.toHaveBeenCalled();
  });

  it("generates a tailoring preview without persisting a version", async () => {
    parseJobDescriptionMock.mockResolvedValue(jobAnalysis());
    generateAIJSONMock.mockResolvedValue(aiOutput());

    const result = await generateTailoredResume("resume-1", "user-1", {
      jobDescription: "We need a senior engineer with React experience.",
    });

    expect(result.jobTitle).toBe("Senior Engineer");
    expect(result.tailored.summary).toBe("Tailored summary");
    expect(result.matchScore.overallScore).toBeGreaterThan(0);
    expect(result.warnings).toEqual([]);
    expect(resumeVersionCreateMock).not.toHaveBeenCalled();
  });

  it("filters out AI-invented ids and skills, adding warnings", async () => {
    parseJobDescriptionMock.mockResolvedValue(jobAnalysis());
    generateAIJSONMock.mockResolvedValue(
      aiOutput({
        experience: [{ id: "exp-does-not-exist", description: "Invented." }],
        skills: ["Quantum Computing"],
      }),
    );

    const result = await generateTailoredResume("resume-1", "user-1", {
      jobDescription: "We need a senior engineer with React experience.",
    });

    expect(result.tailored.experience).toEqual([]);
    // Falls back to the original skill list since every suggestion was invalid.
    expect(result.tailored.skills).toEqual(["React", "Node.js"]);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(jobAnalysis().confidence.overall);
  });

  it("computes an ATS score from keyword coverage and skill match, independent of overallScore", async () => {
    parseJobDescriptionMock.mockResolvedValue(jobAnalysis());
    generateAIJSONMock.mockResolvedValue(aiOutput());

    const result = await generateTailoredResume("resume-1", "user-1", {
      jobDescription: "We need a senior engineer with React experience.",
    });

    expect(result.matchScore.atsScore).toBe(
      Math.round(
        result.matchScore.keywordCoverageScore * 0.5 +
          result.matchScore.skillMatchScore * 0.5,
      ),
    );
    expect(result.matchScore.atsScore).toBeGreaterThan(0);
  });

  it("uses a saved job description's title when no explicit title is parsed", async () => {
    getOwnedJobDescriptionOrThrowMock.mockResolvedValue({
      id: "jd-1",
      userId: "user-1",
      title: "Acme Senior Engineer",
      content: "Full job description content here.",
    });
    parseJobDescriptionMock.mockResolvedValue(
      jobAnalysis(),
    );
    generateAIJSONMock.mockResolvedValue(aiOutput());

    const result = await generateTailoredResume("resume-1", "user-1", {
      jobDescriptionId: "jd-1",
    });

    expect(getOwnedJobDescriptionOrThrowMock).toHaveBeenCalledWith(
      "jd-1",
      "user-1",
    );
    expect(result.jobDescriptionId).toBe("jd-1");
  });
});

describe("saveTailoredResume", () => {
  beforeEach(() => {
    getOwnedResumeOrThrowMock.mockReset();
    resumeSectionFindManyMock.mockReset();
    resumeVersionFindFirstMock.mockReset();
    resumeVersionCreateMock.mockReset();

    getOwnedResumeOrThrowMock.mockResolvedValue({
      id: "resume-1",
      userId: "user-1",
      title: "My Resume",
      status: "DRAFT",
    });
    resumeSectionFindManyMock.mockResolvedValue(dbSections());
    resumeVersionFindFirstMock.mockResolvedValue(null);
  });

  it("creates a new version merging tailored content, leaving live sections untouched", async () => {
    resumeVersionCreateMock.mockImplementation(({ data }) =>
      Promise.resolve({
        id: "version-1",
        resumeId: data.resumeId,
        versionNumber: data.versionNumber,
        content: data.content,
        note: data.note,
        createdAt: new Date(),
      }),
    );

    const version = await saveTailoredResume("resume-1", "user-1", {
      note: "",
      jobDescriptionId: "jd-1",
      jobTitle: "Senior Engineer",
      jobAnalysis: jobAnalysis(),
      tailored: aiOutput(),
      matchScore: {
        overallScore: 80,
        skillMatchScore: 80,
        experienceMatchScore: 80,
        atsScore: 80,
        keywordCoverageScore: 80,
      },
      confidence: 75,
      summary: {
        overallImprovements: [],
        sectionsModified: [],
        keywordsIncorporated: [],
        missingSkillsIdentified: [],
        recommendations: [],
      },
    });

    expect(version.versionNumber).toBe(1);
    expect(version.content.tailoring?.jobTitle).toBe("Senior Engineer");

    const summarySection = version.content.sections.find(
      (s: { type: string }) => s.type === "SUMMARY",
    );
    expect((summarySection?.content as { text: string }).text).toBe(
      "Tailored summary",
    );

    // Live resume sections were only read, never written.
    expect(resumeSectionFindManyMock).toHaveBeenCalledTimes(1);
  });
});
