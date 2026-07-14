import { describe, expect, it } from "vitest";

import {
  computeExperienceMatchScore,
  matchSkills,
} from "@/services/skill-matching.service";
import type { ParsedJobDescription } from "@/types/job-parser.schema";

function jobAnalysis(
  overrides: Partial<ParsedJobDescription> = {},
): ParsedJobDescription {
  return {
    company: { name: "Acme", industry: "Software", location: "Remote" },
    position: {
      title: "Senior Engineer",
      department: "",
      employmentType: "",
      experienceRequired: "",
      educationRequired: "",
    },
    responsibilities: ["Own the API"],
    requiredSkills: {
      technical: ["React", "Node.js"],
      programmingLanguages: ["TypeScript"],
      frameworks: [],
      tools: [],
      softSkills: [],
    },
    preferredSkills: ["GraphQL"],
    keywords: [
      { keyword: "React", importance: 9 },
      { keyword: "AWS", importance: 5 },
    ],
    technologies: {
      languages: [],
      frameworks: [],
      databases: [],
      cloudPlatforms: [],
      devopsTools: [],
      other: [],
    },
    salary: "",
    workMode: "",
    applicationDeadline: "",
    confidence: { overall: 80, sections: {}, lowConfidenceFields: [] },
    ...overrides,
  };
}

describe("matchSkills", () => {
  it("identifies strong and weak matches and reports missing skills", () => {
    const result = matchSkills(
      ["React", "TypeScript"],
      "React TypeScript resume content",
      jobAnalysis(),
    );

    expect(result.strongMatches).toEqual(
      expect.arrayContaining(["React", "TypeScript"]),
    );
    expect(result.missingSkills).toEqual(
      expect.arrayContaining(["Node.js", "GraphQL"]),
    );
    expect(result.skillMatchScore).toBeGreaterThan(0);
    expect(result.skillMatchScore).toBeLessThanOrEqual(100);
  });

  it("returns full coverage when there are no job requirements", () => {
    const result = matchSkills(
      [],
      "",
      jobAnalysis({
        requiredSkills: {
          technical: [],
          programmingLanguages: [],
          frameworks: [],
          tools: [],
          softSkills: [],
        },
        preferredSkills: [],
        keywords: [],
      }),
    );

    expect(result.skillMatchScore).toBe(100);
    expect(result.keywordCoverage).toBe(100);
  });

  it("weights keyword coverage by importance", () => {
    const result = matchSkills(["React"], "React", jobAnalysis());
    // Only the higher-importance "React" keyword (9) matched out of 9+5=14.
    expect(result.keywordCoverage).toBe(Math.round((9 / 14) * 100));
  });
});

describe("computeExperienceMatchScore", () => {
  it("returns 0 for empty experience text", () => {
    expect(computeExperienceMatchScore("", jobAnalysis())).toBe(0);
  });

  it("returns 100 when the job has no required/preferred skills", () => {
    const score = computeExperienceMatchScore(
      "built things",
      jobAnalysis({
        requiredSkills: {
          technical: [],
          programmingLanguages: [],
          frameworks: [],
          tools: [],
          softSkills: [],
        },
        preferredSkills: [],
      }),
    );
    expect(score).toBe(100);
  });

  it("scores the proportion of matched terms found in the experience text", () => {
    const score = computeExperienceMatchScore(
      "Built APIs with React and Node.js",
      jobAnalysis(),
    );
    // React, Node.js match; TypeScript and GraphQL don't => 2/4.
    expect(score).toBe(50);
  });
});
