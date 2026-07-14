import { beforeEach, describe, expect, it, vi } from "vitest";

const generateAIJSONMock = vi.fn();
vi.mock("@/services/ai.service", () => ({
  generateAIJSON: (...args: unknown[]) => generateAIJSONMock(...args),
}));

const extractTextFromDocumentMock = vi.fn();
vi.mock("@/lib/parsing/document-extraction", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/parsing/document-extraction")
  >("@/lib/parsing/document-extraction");
  return {
    ...actual,
    extractTextFromDocument: (...args: unknown[]) =>
      extractTextFromDocumentMock(...args),
  };
});

const { ResumeParserServiceError, parseResume } = await import(
  "@/services/resume-parser.service"
);
const { DocumentExtractionError } = await import(
  "@/lib/parsing/document-extraction"
);

const validFile = {
  buffer: Buffer.from("resume bytes"),
  filename: "resume.pdf",
  mimeType: "application/pdf",
};

function emptyAIOutput() {
  return {
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      portfolio: "",
      github: "",
    },
    summary: { summary: "", careerObjective: "" },
    experience: [],
    projects: [],
    education: [],
    skills: {
      programmingLanguages: [],
      frameworks: [],
      libraries: [],
      databases: [],
      cloud: [],
      tools: [],
      softSkills: [],
      other: [],
    },
    certifications: [],
    languages: [],
  };
}

describe("parseResume", () => {
  beforeEach(() => {
    generateAIJSONMock.mockReset();
    extractTextFromDocumentMock.mockReset();
    extractTextFromDocumentMock.mockResolvedValue("Jane Doe resume text");
  });

  it("rejects unsupported file types before extraction", async () => {
    await expect(
      parseResume(
        { buffer: Buffer.from("x"), filename: "resume.txt", mimeType: "text/plain" },
        "user-1",
      ),
    ).rejects.toThrow(ResumeParserServiceError);
    expect(extractTextFromDocumentMock).not.toHaveBeenCalled();
  });

  it("rejects empty files", async () => {
    await expect(
      parseResume(
        { buffer: Buffer.alloc(0), filename: "resume.pdf", mimeType: "application/pdf" },
        "user-1",
      ),
    ).rejects.toThrow(/empty/);
  });

  it("rejects files over the size limit", async () => {
    await expect(
      parseResume(
        {
          buffer: Buffer.alloc(6 * 1024 * 1024),
          filename: "resume.pdf",
          mimeType: "application/pdf",
        },
        "user-1",
      ),
    ).rejects.toThrow(/too large/);
  });

  it("wraps document extraction failures as a service error", async () => {
    extractTextFromDocumentMock.mockRejectedValue(
      new DocumentExtractionError("The PDF file could not be read."),
    );

    await expect(parseResume(validFile, "user-1")).rejects.toThrow(
      ResumeParserServiceError,
    );
  });

  it("normalizes AI output and computes deterministic confidence", async () => {
    generateAIJSONMock.mockResolvedValue({
      ...emptyAIOutput(),
      personalInfo: {
        name: "Jane Doe",
        email: "not-an-email",
        phone: "555-1234",
        location: "Remote",
        linkedin: "linkedin.com/in/jane",
        portfolio: "not a url",
        github: "github.com/jane",
      },
      experience: [
        {
          company: "Acme",
          position: "Engineer",
          employmentType: "Full-time",
          startDate: "2020",
          endDate: "Present",
          current: true,
          location: "Remote",
          responsibilities: ["Built things", "", "  "],
          achievements: ["Shipped X"],
          technologiesUsed: ["React", "react", "Node"],
        },
      ],
      skills: {
        programmingLanguages: ["TypeScript", "typescript"],
        frameworks: [],
        libraries: [],
        databases: [],
        cloud: [],
        tools: [],
        softSkills: [],
        other: [],
      },
    });

    const result = await parseResume(validFile, "user-1");

    expect(result.personalInfo.email).toBe("");
    expect(result.personalInfo.portfolio).toBe("");
    expect(result.personalInfo.linkedin).toBe("linkedin.com/in/jane");
    expect(result.experience[0].responsibilities).toEqual(["Built things"]);
    expect(result.experience[0].technologiesUsed).toEqual(["React", "Node"]);
    expect(result.skills.programmingLanguages).toEqual(["TypeScript"]);
    expect(result.confidence.overall).toBeGreaterThan(0);
    expect(result.confidence.lowConfidenceFields).toContain("personalInfo.email");
  });

  it("returns zero overall confidence when the AI output is entirely empty", async () => {
    generateAIJSONMock.mockResolvedValue(emptyAIOutput());

    const result = await parseResume(validFile, "user-1");

    expect(result.confidence.overall).toBe(0);
    expect(result.experience).toEqual([]);
  });
});
