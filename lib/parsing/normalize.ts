// Small pure helpers shared by the resume and job description parsers for
// the "Validation" step of the parsing pipeline (dedupe skills, validate
// emails/URLs) — see .claude/docs/ai.md's AI Architecture pipeline.

export function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidUrl(value: string): boolean {
  if (!value.trim()) return false;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

// Returns the trimmed value if it is a valid URL, otherwise an empty string
// — invalid URLs are dropped rather than surfaced to downstream features.
export function sanitizeUrl(value: string): string {
  const trimmed = value.trim();
  return isValidUrl(trimmed) ? trimmed : "";
}

export function filterEmpty(values: string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}
