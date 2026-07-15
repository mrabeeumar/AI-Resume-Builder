import "@/lib/ai/prompts";

import { getPrompt } from "@/lib/ai/prompt-manager";
import type { ResumeSectionType } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { generateAIJSON } from "@/services/ai.service";
import { getOwnedResumeOrThrow } from "@/services/resume.service";
import {
  atsAnalysisResultSchema,
  atsAnalyzeSchema,
  type AtsAnalyzeInput,
  type AtsReport,
} from "@/types/ai";
import {
  parseSectionContent,
  type EducationContent,
  type ExperienceContent,
  type ProjectsContent,
  type SkillsContent,
  type SummaryContent,
} from "@/types/resume-section";

const CORE_SECTION_TYPES: ResumeSectionType[] = [
  "SUMMARY",
  "EXPERIENCE",
  "EDUCATION",
  "SKILLS",
];

const CACHE_TTL_SECONDS = 60 * 60;

type StoredSection = { type: string; content: string };

// Cache key only needs to be stable, not cryptographically strong.
function hashJobDescription(jobDescription: string): string {
  let hash = 0;
  for (let i = 0; i < jobDescription.length; i += 1) {
    hash = (hash * 31 + jobDescription.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

function isSectionEmpty(type: ResumeSectionType, content: unknown): boolean {
  switch (type) {
    case "SUMMARY":
      return !(content as SummaryContent).text?.trim();
    case "EXPERIENCE":
      return (content as ExperienceContent).items.length === 0;
    case "EDUCATION":
      return (content as EducationContent).items.length === 0;
    case "SKILLS":
      return (content as SkillsContent).items.length === 0;
    default:
      return true;
  }
}

// Sections are checked deterministically against actual content rather than
// left to the model, since "is this section empty" is an objective fact the
// database already knows.
function getMissingSections(sections: StoredSection[]): ResumeSectionType[] {
  const byType = new Map<ResumeSectionType, unknown>(
    sections.map((section) => {
      const type = section.type as ResumeSectionType;
      return [type, parseSectionContent(type, JSON.parse(section.content))];
    }),
  );

  return CORE_SECTION_TYPES.filter((type) => {
    const content = byType.get(type);
    return content === undefined || isSectionEmpty(type, content);
  });
}

function buildResumeSummary(sections: StoredSection[]): string {
  const parts: string[] = [];

  for (const section of sections) {
    const type = section.type as ResumeSectionType;
    const content = parseSectionContent(type, JSON.parse(section.content));

    if (type === "SUMMARY") {
      const summary = content as SummaryContent;
      if (summary.text) parts.push(`Summary: ${summary.text}`);
    } else if (type === "EXPERIENCE") {
      const experience = content as ExperienceContent;
      for (const item of experience.items) {
        parts.push(
          `Experience (${item.role} at ${item.company}): ${item.description}`,
        );
      }
    } else if (type === "EDUCATION") {
      const education = content as EducationContent;
      for (const item of education.items) {
        parts.push(
          `Education: ${item.degree} in ${item.fieldOfStudy} at ${item.school}`,
        );
      }
    } else if (type === "SKILLS") {
      const skills = content as SkillsContent;
      if (skills.items.length > 0) {
        parts.push(`Skills: ${skills.items.join(", ")}`);
      }
    } else if (type === "PROJECTS") {
      const projects = content as ProjectsContent;
      for (const item of projects.items) {
        parts.push(`Project: ${item.name} — ${item.description}`);
      }
    }
  }

  return parts.join("\n") || "The resume has no content yet.";
}

// Analyzes a resume against ATS criteria (keywords, skills, readability,
// missing sections, job match) and returns actionable suggestions. Read-only:
// it does not modify the resume. Results are cached in Redis per
// resume+job-description pair since the AI call is expensive and the
// underlying content doesn't change on every view (see .claude/docs/ai.md).
export async function analyzeAts(
  resumeId: string,
  userId: string,
  input: AtsAnalyzeInput,
): Promise<AtsReport> {
  await getOwnedResumeOrThrow(resumeId, userId);
  const { jobDescription } = atsAnalyzeSchema.parse(input);

  const sections = await prisma.resumeSection.findMany({
    where: { resumeId },
  });
  const missingSections = getMissingSections(sections);

  const cacheKey = `ats-report:${resumeId}:${hashJobDescription(jobDescription)}`;
  const cached = await getCachedAtsReport(cacheKey);
  if (cached) {
    return cached;
  }

  const template = getPrompt("ATS_ANALYSIS");

  const analysis = await generateAIJSON({
    feature: "ATS_ANALYSIS",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({
      resumeSummary: buildResumeSummary(sections),
      jobDescription: jobDescription || "Not provided.",
      missingSections: missingSections.join(", ") || "None",
    }),
    schema: atsAnalysisResultSchema,
  });

  const report: AtsReport = { ...analysis, missingSections };

  await cacheAtsReport(cacheKey, report);

  return report;
}

// Redis is optional infrastructure — if it's unreachable (e.g. hits
// maxRetriesPerRequest), fail open rather than surfacing the error to the
// user, matching the pattern in lib/rate-limit.ts.
async function getCachedAtsReport(cacheKey: string): Promise<AtsReport | null> {
  try {
    const cached = await redis?.get(cacheKey);
    return cached ? (JSON.parse(cached) as AtsReport) : null;
  } catch (error) {
    console.error("ATS report cache read failed, skipping cache:", error);
    return null;
  }
}

async function cacheAtsReport(cacheKey: string, report: AtsReport): Promise<void> {
  try {
    await redis?.set(cacheKey, JSON.stringify(report), "EX", CACHE_TTL_SECONDS);
  } catch (error) {
    console.error("ATS report cache write failed:", error);
  }
}
