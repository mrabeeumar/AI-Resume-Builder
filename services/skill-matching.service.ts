import type { ParsedJobDescription } from "@/types/job-parser.schema";
import type { SkillMatchResult } from "@/types/resume-tailoring";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function uniqueNormalized(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = normalize(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value.trim());
  }
  return result;
}

// Deterministic (non-AI) comparison between a resume's skill set and a
// parsed job description's requirements. Kept separate from the AI
// tailoring prompt because "does the resume already contain skill X" is an
// objective, checkable fact — not something that benefits from a model's
// judgment (see .claude/docs/ai.md: prefer deterministic computation).
// Reusable by Resume Tailoring, ATS Analysis, and Skill Gap Analysis.
export function matchSkills(
  resumeSkills: string[],
  resumeText: string,
  jobAnalysis: ParsedJobDescription,
): SkillMatchResult {
  const normalizedResumeSkills = new Set(resumeSkills.map(normalize));
  const normalizedResumeText = normalize(resumeText);

  const requiredSkills = uniqueNormalized([
    ...jobAnalysis.requiredSkills.technical,
    ...jobAnalysis.requiredSkills.programmingLanguages,
    ...jobAnalysis.requiredSkills.frameworks,
    ...jobAnalysis.requiredSkills.tools,
  ]);
  const preferredSkills = uniqueNormalized(jobAnalysis.preferredSkills);

  const isPresent = (skill: string) =>
    normalizedResumeSkills.has(normalize(skill)) ||
    normalizedResumeText.includes(normalize(skill));

  const strongMatches = requiredSkills.filter(isPresent);
  const weakMatches = preferredSkills.filter(
    (skill) => isPresent(skill) && !strongMatches.some((s) => normalize(s) === normalize(skill)),
  );
  const matchingSkills = uniqueNormalized([...strongMatches, ...weakMatches]);

  const missingSkills = uniqueNormalized(
    [...requiredSkills, ...preferredSkills].filter((skill) => !isPresent(skill)),
  );

  const skillMatchScore =
    requiredSkills.length + preferredSkills.length > 0
      ? Math.round(
          ((strongMatches.length + weakMatches.length * 0.5) /
            (requiredSkills.length + preferredSkills.length * 0.5)) *
            100,
        )
      : 100;

  const keywords = jobAnalysis.keywords;
  const totalKeywordWeight = keywords.reduce((sum, k) => sum + k.importance, 0);
  const matchedKeywordWeight = keywords
    .filter((k) => isPresent(k.keyword))
    .reduce((sum, k) => sum + k.importance, 0);
  const keywordCoverage =
    totalKeywordWeight > 0
      ? Math.round((matchedKeywordWeight / totalKeywordWeight) * 100)
      : 100;

  return {
    matchingSkills,
    missingSkills,
    strongMatches,
    weakMatches,
    keywordCoverage,
    skillMatchScore: Math.min(100, Math.max(0, skillMatchScore)),
  };
}

// Percentage of the job's required/preferred skills and keywords that
// appear specifically within the candidate's experience descriptions
// (rather than just the skills list) — used for the "experience match"
// facet of the match score.
export function computeExperienceMatchScore(
  experienceText: string,
  jobAnalysis: ParsedJobDescription,
): number {
  const normalizedExperienceText = normalize(experienceText);
  if (!normalizedExperienceText) return 0;

  const terms = uniqueNormalized([
    ...jobAnalysis.requiredSkills.technical,
    ...jobAnalysis.requiredSkills.programmingLanguages,
    ...jobAnalysis.requiredSkills.frameworks,
    ...jobAnalysis.requiredSkills.tools,
    ...jobAnalysis.preferredSkills,
  ]);

  if (terms.length === 0) return 100;

  const matched = terms.filter((term) =>
    normalizedExperienceText.includes(normalize(term)),
  );

  return Math.round((matched.length / terms.length) * 100);
}
