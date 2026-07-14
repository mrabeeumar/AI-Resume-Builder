import { describe, expect, it } from "vitest";

import { parsedJobDescriptionAIOutputSchema } from "@/types/job-parser.schema";

describe("parsedJobDescriptionAIOutputSchema", () => {
  it("fills in defaults for a minimal/empty AI response", () => {
    const result = parsedJobDescriptionAIOutputSchema.parse({});

    expect(result.company.name).toBe("");
    expect(result.responsibilities).toEqual([]);
    expect(result.keywords).toEqual([]);
  });

  it("accepts a fully populated response", () => {
    const result = parsedJobDescriptionAIOutputSchema.parse({
      company: { name: "Acme", industry: "Software", location: "Remote" },
      position: {
        title: "Senior Engineer",
        department: "Platform",
        employmentType: "Full-time",
        experienceRequired: "5+ years",
        educationRequired: "BS in CS",
      },
      responsibilities: ["Own the API"],
      requiredSkills: {
        technical: ["System design"],
        programmingLanguages: ["TypeScript"],
        frameworks: ["Next.js"],
        tools: ["Git"],
        softSkills: ["Communication"],
      },
      preferredSkills: ["GraphQL"],
      keywords: [{ keyword: "TypeScript", importance: 8 }],
      technologies: {
        languages: ["TypeScript"],
        frameworks: ["Next.js"],
        databases: ["PostgreSQL"],
        cloudPlatforms: ["AWS"],
        devopsTools: ["Docker"],
        other: [],
      },
    });

    expect(result.keywords[0].importance).toBe(8);
  });

  it("rejects a keyword importance outside the 1-10 range", () => {
    const result = parsedJobDescriptionAIOutputSchema.safeParse({
      keywords: [{ keyword: "TypeScript", importance: 15 }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects malformed field types instead of coercing them", () => {
    const result = parsedJobDescriptionAIOutputSchema.safeParse({
      position: { title: 42 },
    });

    expect(result.success).toBe(false);
  });
});
