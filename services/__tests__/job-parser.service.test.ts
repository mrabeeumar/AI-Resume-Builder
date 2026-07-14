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

const { JobParserServiceError, parseJobDescription } = await import(
  "@/services/job-parser.service"
);

function emptyAIOutput() {
  return {
    company: { name: "", industry: "", location: "" },
    position: {
      title: "",
      department: "",
      employmentType: "",
      experienceRequired: "",
      educationRequired: "",
    },
    responsibilities: [],
    requiredSkills: {
      technical: [],
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
  };
}

describe("parseJobDescription", () => {
  beforeEach(() => {
    generateAIJSONMock.mockReset();
    extractTextFromDocumentMock.mockReset();
  });

  it("rejects text that is too short to parse", async () => {
    await expect(
      parseJobDescription({ kind: "text", content: "too short" }, "user-1"),
    ).rejects.toThrow(JobParserServiceError);
    expect(generateAIJSONMock).not.toHaveBeenCalled();
  });

  it("rejects an unsupported file type", async () => {
    await expect(
      parseJobDescription(
        {
          kind: "file",
          file: {
            buffer: Buffer.from("x"),
            filename: "job.exe",
            mimeType: "application/x-msdownload",
          },
        },
        "user-1",
      ),
    ).rejects.toThrow(/Unsupported file type/);
  });

  it("parses plain text and merges duplicate keywords keeping the higher importance", async () => {
    generateAIJSONMock.mockResolvedValue({
      ...emptyAIOutput(),
      company: { name: "Acme", industry: "Software", location: "Remote" },
      keywords: [
        { keyword: "React", importance: 6 },
        { keyword: "react", importance: 9 },
        { keyword: "Node.js", importance: 4 },
      ],
      responsibilities: ["Own the API", "", "  "],
    });

    const result = await parseJobDescription(
      {
        kind: "text",
        content:
          "We are hiring a senior engineer to own our API and platform work.",
      },
      "user-1",
    );

    expect(result.keywords).toEqual([
      { keyword: "React", importance: 9 },
      { keyword: "Node.js", importance: 4 },
    ]);
    expect(result.responsibilities).toEqual(["Own the API"]);
    expect(result.confidence.sections.company).toBe(100);
  });

  it("extracts from a file when text is provided as a document", async () => {
    extractTextFromDocumentMock.mockResolvedValue(
      "A full job description with enough content to pass the length check.",
    );
    generateAIJSONMock.mockResolvedValue(emptyAIOutput());

    const result = await parseJobDescription(
      {
        kind: "file",
        file: {
          buffer: Buffer.from("docx bytes"),
          filename: "job.docx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      },
      "user-1",
    );

    expect(extractTextFromDocumentMock).toHaveBeenCalledOnce();
    expect(result.confidence.overall).toBe(0);
  });
});
