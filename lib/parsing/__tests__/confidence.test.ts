import { describe, expect, it } from "vitest";

import { computeConfidence } from "@/lib/parsing/confidence";

describe("computeConfidence", () => {
  it("scores a fully-present section at 100", () => {
    const result = computeConfidence({
      personalInfo: [
        { path: "personalInfo.name", present: true },
        { path: "personalInfo.email", present: true },
      ],
    });

    expect(result.sections.personalInfo).toBe(100);
    expect(result.overall).toBe(100);
    expect(result.lowConfidenceFields).toEqual([]);
  });

  it("scores a partially-present section proportionally and flags missing fields", () => {
    const result = computeConfidence({
      personalInfo: [
        { path: "personalInfo.name", present: true },
        { path: "personalInfo.email", present: false },
      ],
    });

    expect(result.sections.personalInfo).toBe(50);
    expect(result.lowConfidenceFields).toEqual(["personalInfo.email"]);
  });

  it("averages scores across multiple sections", () => {
    const result = computeConfidence({
      a: [{ path: "a.x", present: true }],
      b: [{ path: "b.x", present: false }],
    });

    expect(result.overall).toBe(50);
  });

  it("skips sections with no fields and returns 0 overall when everything is empty", () => {
    const result = computeConfidence({ empty: [] });
    expect(result.sections).toEqual({});
    expect(result.overall).toBe(0);
  });
});
