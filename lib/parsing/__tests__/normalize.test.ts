import { describe, expect, it } from "vitest";

import {
  dedupeStrings,
  filterEmpty,
  isValidEmail,
  isValidUrl,
  sanitizeUrl,
} from "@/lib/parsing/normalize";

describe("dedupeStrings", () => {
  it("removes case-insensitive duplicates and trims whitespace", () => {
    expect(dedupeStrings(["React", " react ", "Node.js", "REACT"])).toEqual([
      "React",
      "Node.js",
    ]);
  });

  it("drops empty entries", () => {
    expect(dedupeStrings(["", "  ", "TypeScript"])).toEqual(["TypeScript"]);
  });

  it("returns an empty array for empty input", () => {
    expect(dedupeStrings([])).toEqual([]);
  });
});

describe("isValidEmail", () => {
  it("accepts well-formed emails", () => {
    expect(isValidEmail("jane@example.com")).toBe(true);
  });

  it("rejects malformed emails", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing@domain")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isValidUrl / sanitizeUrl", () => {
  it("accepts URLs with a scheme", () => {
    expect(isValidUrl("https://linkedin.com/in/jane")).toBe(true);
  });

  it("accepts bare domains by assuming https", () => {
    expect(isValidUrl("linkedin.com/in/jane")).toBe(true);
  });

  it("rejects garbage input", () => {
    expect(isValidUrl("not a url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
  });

  it("sanitizeUrl drops invalid URLs instead of throwing", () => {
    expect(sanitizeUrl("not a url")).toBe("");
    expect(sanitizeUrl("github.com/jane")).toBe("github.com/jane");
  });
});

describe("filterEmpty", () => {
  it("trims and removes blank strings", () => {
    expect(filterEmpty([" led a team ", "", "  "])).toEqual(["led a team"]);
  });
});
