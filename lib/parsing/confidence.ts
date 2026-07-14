import type { ParserConfidence } from "@/types/parser";

export type FieldPresence = { path: string; present: boolean };

// Computes a deterministic confidence score from field completeness rather
// than trusting the AI's self-reported confidence (see .claude/docs/ai.md —
// AI output must always be validated, not trusted). Each section's score is
// the percentage of its fields that were actually extracted; the overall
// score is the average across sections. Missing fields are surfaced
// individually so callers can flag exactly what's incomplete/low-confidence.
export function computeConfidence(
  sectionFields: Record<string, FieldPresence[]>,
): ParserConfidence {
  const sections: Record<string, number> = {};
  const lowConfidenceFields: string[] = [];
  const sectionScores: number[] = [];

  for (const [section, fields] of Object.entries(sectionFields)) {
    if (fields.length === 0) continue;

    const presentCount = fields.filter((field) => field.present).length;
    const score = Math.round((presentCount / fields.length) * 100);
    sections[section] = score;
    sectionScores.push(score);

    for (const field of fields) {
      if (!field.present) lowConfidenceFields.push(field.path);
    }
  }

  const overall =
    sectionScores.length > 0
      ? Math.round(
          sectionScores.reduce((sum, score) => sum + score, 0) /
            sectionScores.length,
        )
      : 0;

  return { overall, sections, lowConfidenceFields };
}
