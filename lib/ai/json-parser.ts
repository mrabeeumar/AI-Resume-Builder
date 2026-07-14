import type { ZodType } from "zod";

import { AIResponseValidationError } from "@/lib/ai/errors";

// Extracts a JSON object/array from raw model output. Models frequently wrap
// JSON in markdown code fences or add leading/trailing prose, so this pulls
// out the first balanced JSON value rather than assuming a clean payload.
function extractJSONCandidate(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced ? fenced[1] : text;

  const start = source.search(/[[{]/);
  if (start === -1) {
    throw new AIResponseValidationError(
      "AI response did not contain any JSON content.",
      text,
    );
  }

  const openChar = source[start];
  const closeChar = openChar === "{" ? "}" : "]";

  // Track string/escape state so braces or brackets that appear *inside*
  // string values don't throw off the depth count.
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === openChar) {
      depth += 1;
    } else if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  throw new AIResponseValidationError(
    "AI response contained an unterminated JSON value.",
    text,
  );
}

export function parseAndValidateJSON<T>(text: string, schema: ZodType<T>): T {
  let parsed: unknown;
  try {
    // Providers running in JSON mode return a clean payload, so try the
    // whole (trimmed) response first and only fall back to extraction when
    // the model wrapped it in fences or prose.
    const trimmed = text.trim();
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      parsed = JSON.parse(extractJSONCandidate(text));
    }
  } catch (error) {
    if (error instanceof AIResponseValidationError) {
      throw error;
    }
    throw new AIResponseValidationError("AI response was not valid JSON.", text);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new AIResponseValidationError(
      `AI response failed schema validation: ${result.error.message}`,
      text,
    );
  }

  return result.data;
}
