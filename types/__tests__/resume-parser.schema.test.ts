import { describe, expect, it } from "vitest";

import { parsedResumeAIOutputSchema } from "@/types/resume-parser.schema";

describe("parsedResumeAIOutputSchema", () => {
  it("fills in defaults for a minimal/empty AI response", () => {
    const result = parsedResumeAIOutputSchema.parse({});

    expect(result.personalInfo.name).toBe("");
    expect(result.experience).toEqual([]);
    expect(result.skills.programmingLanguages).toEqual([]);
  });

  it("accepts a fully populated response", () => {
    const result = parsedResumeAIOutputSchema.parse({
      personalInfo: {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "555-1234",
        location: "Remote",
        linkedin: "linkedin.com/in/jane",
        portfolio: "jane.dev",
        github: "github.com/jane",
      },
      summary: { summary: "Experienced engineer.", careerObjective: "" },
      experience: [
        {
          company: "Acme",
          position: "Engineer",
          employmentType: "Full-time",
          startDate: "2020",
          endDate: "",
          current: true,
          location: "Remote",
          responsibilities: ["Built things"],
          achievements: ["Shipped X"],
          technologiesUsed: ["React"],
        },
      ],
      education: [
        {
          institution: "MIT",
          degree: "BS",
          field: "CS",
          gpa: "3.9",
          startDate: "2016",
          endDate: "2020",
        },
      ],
      skills: {
        programmingLanguages: ["TypeScript"],
        frameworks: ["Next.js"],
        libraries: [],
        databases: [],
        cloud: [],
        tools: [],
        softSkills: [],
        other: [],
      },
    });

    expect(result.experience).toHaveLength(1);
    expect(result.education[0].institution).toBe("MIT");
  });

  it("rejects malformed field types instead of coercing them", () => {
    const result = parsedResumeAIOutputSchema.safeParse({
      personalInfo: { name: 12345 },
    });

    expect(result.success).toBe(false);
  });

  it("truncates skill entries that exceed the max item length", () => {
    const result = parsedResumeAIOutputSchema.safeParse({
      skills: { programmingLanguages: ["x".repeat(61)] },
    });

    expect(result.success).toBe(false);
  });
});
