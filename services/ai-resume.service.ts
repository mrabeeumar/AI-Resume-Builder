import "@/lib/ai/prompts";

import { getPrompt } from "@/lib/ai/prompt-manager";
import type { ResumeSectionType } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { generateAIJSON } from "@/services/ai.service";
import { createVersionSnapshot } from "@/services/resume-version.service";
import {
  getOwnedResumeOrThrow,
  ResumeServiceError,
} from "@/services/resume.service";
import {
  generateResumeSchema,
  generatedResumeContentSchema,
  improveBulletSchema,
  improvedBulletSchema,
  keywordOptimizeSchema,
  keywordSuggestionsSchema,
  rewriteSectionSchema,
  type GenerateResumeInput,
  type ImproveBulletInput,
  type KeywordOptimizeInput,
  type RewriteSectionInput,
} from "@/types/ai";
import {
  parseSectionContent,
  sectionContentSchemas,
  type ExperienceContent,
  type ResumeSectionItem,
  type SkillsContent,
  type SummaryContent,
} from "@/types/resume-section";

function serializeSection(section: {
  id: string;
  resumeId: string;
  type: string;
  order: number;
  hidden: boolean;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}): ResumeSectionItem {
  return {
    ...section,
    type: section.type as ResumeSectionType,
    content: JSON.parse(section.content),
  };
}

async function upsertSectionContent(
  resumeId: string,
  type: ResumeSectionType,
  content: unknown,
  existingByType: Map<ResumeSectionType, { id: string }>,
) {
  const parsed = parseSectionContent(type, content);
  const existing = existingByType.get(type);

  if (existing) {
    return prisma.resumeSection.update({
      where: { id: existing.id },
      data: { content: JSON.stringify(parsed) },
    });
  }

  const last = await prisma.resumeSection.findFirst({
    where: { resumeId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return prisma.resumeSection.create({
    data: {
      resumeId,
      type,
      order: (last?.order ?? -1) + 1,
      content: JSON.stringify(parsed),
    },
  });
}

function withGeneratedIds<T extends object>(items: T[]) {
  return items.map((item) => ({ id: crypto.randomUUID(), ...item }));
}

// Generates content for a resume's core sections from a free-text
// background (and optional target job description), overwriting any
// existing SUMMARY/EXPERIENCE/EDUCATION/SKILLS/PROJECTS content. A version
// snapshot is taken first so the prior state can always be restored.
export async function generateResumeContent(
  resumeId: string,
  userId: string,
  input: GenerateResumeInput,
) {
  await getOwnedResumeOrThrow(resumeId, userId);
  const { background, jobDescription } = generateResumeSchema.parse(input);

  const template = getPrompt("RESUME_GENERATION");
  const generated = await generateAIJSON({
    feature: "RESUME_GENERATION",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({ background, jobDescription }),
    schema: generatedResumeContentSchema,
  });

  await createVersionSnapshot(resumeId, "Before AI resume generation");

  const existingSections = await prisma.resumeSection.findMany({
    where: { resumeId },
  });
  const existingByType = new Map(
    existingSections.map((section) => [
      section.type as ResumeSectionType,
      { id: section.id },
    ]),
  );

  await upsertSectionContent(
    resumeId,
    "SUMMARY",
    { text: generated.summary },
    existingByType,
  );
  await upsertSectionContent(
    resumeId,
    "EXPERIENCE",
    { items: withGeneratedIds(generated.experience) },
    existingByType,
  );
  await upsertSectionContent(
    resumeId,
    "EDUCATION",
    { items: withGeneratedIds(generated.education) },
    existingByType,
  );
  await upsertSectionContent(
    resumeId,
    "SKILLS",
    { items: generated.skills },
    existingByType,
  );
  await upsertSectionContent(
    resumeId,
    "PROJECTS",
    { items: withGeneratedIds(generated.projects) },
    existingByType,
  );

  const sections = await prisma.resumeSection.findMany({
    where: { resumeId },
    orderBy: { order: "asc" },
  });

  return sections.map(serializeSection);
}

// Rewrites a single section's text fields for clarity/impact, optionally
// tailored toward a job description. The AI is instructed to preserve the
// section's JSON structure (including item ids) verbatim.
export async function rewriteSection(
  resumeId: string,
  sectionId: string,
  userId: string,
  input: RewriteSectionInput,
) {
  await getOwnedResumeOrThrow(resumeId, userId);
  const { instructions, jobDescription } = rewriteSectionSchema.parse(input);

  const section = await prisma.resumeSection.findUnique({
    where: { id: sectionId },
  });
  if (!section || section.resumeId !== resumeId) {
    throw new ResumeServiceError("Section not found.", 404);
  }

  const type = section.type as ResumeSectionType;
  const template = getPrompt("RESUME_REWRITE");

  const rewritten = await generateAIJSON({
    feature: "RESUME_REWRITE",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({
      currentContent: section.content,
      instructions,
      jobDescription,
    }),
    schema: sectionContentSchemas[type],
  });

  await createVersionSnapshot(resumeId, "Before AI section rewrite");

  const updated = await prisma.resumeSection.update({
    where: { id: sectionId },
    data: { content: JSON.stringify(parseSectionContent(type, rewritten)) },
  });

  return serializeSection(updated);
}

// Improves a single bullet/description string. Not resume-scoped: the
// caller applies the returned text into whichever field it came from via
// the existing section update endpoint.
export async function improveBullet(
  userId: string,
  input: ImproveBulletInput,
) {
  const { text, context } = improveBulletSchema.parse(input);
  const template = getPrompt("BULLET_IMPROVEMENT");

  return generateAIJSON({
    feature: "BULLET_IMPROVEMENT",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({ text, context }),
    schema: improvedBulletSchema,
  });
}

// Compares a resume's current skills/experience/summary content against a
// target job description and suggests missing keywords. Read-only: it does
// not modify the resume, so no version snapshot is needed.
export async function optimizeKeywords(
  resumeId: string,
  userId: string,
  input: KeywordOptimizeInput,
) {
  await getOwnedResumeOrThrow(resumeId, userId);
  const { jobDescription } = keywordOptimizeSchema.parse(input);

  const sections = await prisma.resumeSection.findMany({ where: { resumeId } });
  const summaryParts: string[] = [];

  for (const section of sections) {
    const type = section.type as ResumeSectionType;
    const content = parseSectionContent(type, JSON.parse(section.content));

    if (type === "SKILLS") {
      const skills = content as SkillsContent;
      if (skills.items.length > 0) {
        summaryParts.push(`Skills: ${skills.items.join(", ")}`);
      }
    } else if (type === "EXPERIENCE") {
      const experience = content as ExperienceContent;
      for (const item of experience.items) {
        summaryParts.push(
          `Experience (${item.role} at ${item.company}): ${item.description}`,
        );
      }
    } else if (type === "SUMMARY") {
      const summary = content as SummaryContent;
      if (summary.text) {
        summaryParts.push(`Summary: ${summary.text}`);
      }
    }
  }

  const resumeSummary =
    summaryParts.join("\n") || "The resume has no content yet.";

  const template = getPrompt("KEYWORD_EXTRACTION");

  return generateAIJSON({
    feature: "KEYWORD_EXTRACTION",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({ jobDescription, resumeSummary }),
    schema: keywordSuggestionsSchema,
  });
}
