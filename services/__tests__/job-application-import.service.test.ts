import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const parseJobDescriptionMock = vi.fn();
vi.mock("@/services/job-parser.service", () => ({
  parseJobDescription: (...args: unknown[]) => parseJobDescriptionMock(...args),
}));

const jobApplicationCreateMock = vi.fn();
const applicationTimelineCreateMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    jobApplication: {
      create: (...args: unknown[]) => jobApplicationCreateMock(...args),
    },
    applicationTimeline: {
      create: (...args: unknown[]) => applicationTimelineCreateMock(...args),
    },
  },
}));

const { HtmlExtractionError } = await import("@/lib/parsing/html-extraction");
const { importJobApplicationFromUrl } = await import(
  "@/services/job-application-import.service"
);

function parsedJobDescription(overrides: Record<string, unknown> = {}) {
  return {
    company: { name: "Acme", industry: "Software", location: "Remote" },
    position: {
      title: "Senior Engineer",
      department: "",
      employmentType: "FULL_TIME",
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
    salary: "$150,000",
    workMode: "REMOTE",
    applicationDeadline: "2026-08-01",
    confidence: { overall: 80, sections: {}, lowConfidenceFields: [] },
    ...overrides,
  };
}

describe("job-application-import.service", () => {
  beforeEach(() => {
    parseJobDescriptionMock.mockReset();
    jobApplicationCreateMock.mockReset();
    applicationTimelineCreateMock.mockReset();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects a non-http(s) URL before fetching", async () => {
    await expect(
      importJobApplicationFromUrl({ url: "javascript:alert(1)" }, "user-1"),
    ).rejects.toThrow();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("throws HtmlExtractionError when the page cannot be reached", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network"));

    await expect(
      importJobApplicationFromUrl({ url: "https://example.com/jobs/1" }, "user-1"),
    ).rejects.toThrow(HtmlExtractionError);
  });

  it("throws when the response is not HTML", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => "{}",
    });

    await expect(
      importJobApplicationFromUrl({ url: "https://example.com/jobs/1" }, "user-1"),
    ).rejects.toThrow(HtmlExtractionError);
  });

  it("extracts structured fields and stores null for anything missing", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "text/html" }),
      text: async () =>
        "<html><body><script>ignored()</script><h1>Senior Engineer</h1><p>Join Acme as a remote engineer.</p></body></html>",
    });
    parseJobDescriptionMock.mockResolvedValue(parsedJobDescription());
    jobApplicationCreateMock.mockResolvedValue({
      id: "app-1",
      company: "Acme",
      companyLogo: null,
      position: "Senior Engineer",
      location: "Remote",
      salary: "$150,000",
      employmentType: "FULL_TIME",
      workMode: "REMOTE",
      status: "SAVED",
      source: "URL_IMPORT",
      applicationDate: null,
      deadline: new Date("2026-08-01"),
      originalJobUrl: "https://example.com/jobs/1",
      parsedJobDescription: JSON.stringify(parsedJobDescription()),
      notes: null,
      resumeId: null,
      resumeVersionId: null,
      coverLetterId: null,
      jobDescriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await importJobApplicationFromUrl(
      { url: "https://example.com/jobs/1" },
      "user-1",
    );

    expect(jobApplicationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          company: "Acme",
          position: "Senior Engineer",
          source: "URL_IMPORT",
          employmentType: "FULL_TIME",
          workMode: "REMOTE",
        }),
      }),
    );
    expect(result.company).toBe("Acme");
    expect(applicationTimelineCreateMock).toHaveBeenCalledOnce();
  });

  it("stores null instead of inventing a value for an unrecognized employment type", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "text/html" }),
      text: async () =>
        "<html><body><p>Some reasonably long job posting text goes here.</p></body></html>",
    });
    parseJobDescriptionMock.mockResolvedValue(
      parsedJobDescription({
        position: {
          title: "Engineer",
          department: "",
          employmentType: "Freelance / Gig",
          experienceRequired: "",
          educationRequired: "",
        },
        workMode: "Flexible",
        applicationDeadline: "",
      }),
    );
    jobApplicationCreateMock.mockResolvedValue({
      id: "app-1",
      company: "Acme",
      companyLogo: null,
      position: "Engineer",
      location: "Remote",
      salary: null,
      employmentType: null,
      workMode: null,
      status: "SAVED",
      source: "URL_IMPORT",
      applicationDate: null,
      deadline: null,
      originalJobUrl: "https://example.com/jobs/1",
      parsedJobDescription: null,
      notes: null,
      resumeId: null,
      resumeVersionId: null,
      coverLetterId: null,
      jobDescriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await importJobApplicationFromUrl(
      { url: "https://example.com/jobs/1" },
      "user-1",
    );

    expect(jobApplicationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employmentType: null,
          workMode: null,
          deadline: null,
        }),
      }),
    );
  });
});
