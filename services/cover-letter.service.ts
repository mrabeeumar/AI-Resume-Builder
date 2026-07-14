import "@/lib/ai/prompts";

import { getPrompt } from "@/lib/ai/prompt-manager";
import { prisma } from "@/lib/prisma";
import { generateAIJSON } from "@/services/ai.service";
import { createCoverLetterVersionSnapshot } from "@/services/cover-letter-version.service";
import { getOwnedJobDescriptionOrThrow } from "@/services/job-description.service";
import { getOwnedResumeOrThrow } from "@/services/resume.service";
import { generatedCoverLetterSchema } from "@/types/ai";
import {
  createCoverLetterSchema,
  customizeCoverLetterSchema,
  generateCoverLetterSchema,
  rewriteCoverLetterSchema,
  updateCoverLetterSchema,
  type CoverLetterItem,
  type CreateCoverLetterInput,
  type CustomizeCoverLetterInput,
  type GenerateCoverLetterInput,
  type RewriteCoverLetterInput,
  type UpdateCoverLetterInput,
} from "@/types/cover-letter";

export class CoverLetterServiceError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "CoverLetterServiceError";
  }
}

const coverLetterListSelect = {
  id: true,
  title: true,
  resumeId: true,
  jobDescriptionId: true,
  pageColor: true,
  pageSize: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getOwnedCoverLetterOrThrow(
  coverLetterId: string,
  userId: string,
) {
  const coverLetter = await prisma.coverLetter.findUnique({
    where: { id: coverLetterId },
  });

  if (!coverLetter || coverLetter.userId !== userId) {
    throw new CoverLetterServiceError("Cover letter not found.", 404);
  }

  return coverLetter;
}

export async function listCoverLettersForUser(
  userId: string,
): Promise<CoverLetterItem[]> {
  return prisma.coverLetter.findMany({
    where: { userId },
    select: { ...coverLetterListSelect, content: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCoverLetterForUser(
  coverLetterId: string,
  userId: string,
): Promise<CoverLetterItem> {
  const coverLetter = await getOwnedCoverLetterOrThrow(coverLetterId, userId);

  return coverLetter;
}

async function assertReferencesOwned(
  userId: string,
  resumeId?: string | null,
  jobDescriptionId?: string | null,
) {
  if (resumeId) {
    await getOwnedResumeOrThrow(resumeId, userId);
  }
  if (jobDescriptionId) {
    await getOwnedJobDescriptionOrThrow(jobDescriptionId, userId);
  }
}

export async function createCoverLetter(
  input: CreateCoverLetterInput,
  userId: string,
): Promise<CoverLetterItem> {
  const { title, resumeId, jobDescriptionId, content } =
    createCoverLetterSchema.parse(input);

  await assertReferencesOwned(userId, resumeId, jobDescriptionId);

  return prisma.coverLetter.create({
    data: {
      title,
      content,
      userId,
      resumeId: resumeId ?? null,
      jobDescriptionId: jobDescriptionId ?? null,
    },
    select: { ...coverLetterListSelect, content: true },
  });
}

export async function updateCoverLetter(
  coverLetterId: string,
  input: UpdateCoverLetterInput,
  userId: string,
): Promise<CoverLetterItem> {
  const { title, content, resumeId, jobDescriptionId, pageColor, pageSize } =
    updateCoverLetterSchema.parse(input);
  await getOwnedCoverLetterOrThrow(coverLetterId, userId);
  await assertReferencesOwned(userId, resumeId, jobDescriptionId);

  return prisma.coverLetter.update({
    where: { id: coverLetterId },
    data: {
      title,
      content,
      resumeId: resumeId === undefined ? undefined : resumeId,
      jobDescriptionId:
        jobDescriptionId === undefined ? undefined : jobDescriptionId,
      pageColor,
      pageSize,
    },
    select: { ...coverLetterListSelect, content: true },
  });
}

export async function deleteCoverLetter(coverLetterId: string, userId: string) {
  await getOwnedCoverLetterOrThrow(coverLetterId, userId);

  await prisma.coverLetter.delete({ where: { id: coverLetterId } });
}

// Generates a full cover letter body from a free-text background (and
// optional target job description), overwriting existing content. A
// version snapshot is taken first so the prior state can always be
// restored, mirroring the resume AI-generation pattern.
export async function generateCoverLetter(
  coverLetterId: string,
  userId: string,
  input: GenerateCoverLetterInput,
): Promise<CoverLetterItem> {
  await getOwnedCoverLetterOrThrow(coverLetterId, userId);
  const { background, jobDescription, tone } =
    generateCoverLetterSchema.parse(input);

  const template = getPrompt("COVER_LETTER_GENERATION");
  const generated = await generateAIJSON({
    feature: "COVER_LETTER_GENERATION",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({ background, jobDescription, tone }),
    schema: generatedCoverLetterSchema,
  });

  await createCoverLetterVersionSnapshot(
    coverLetterId,
    "Before AI cover letter generation",
  );

  return prisma.coverLetter.update({
    where: { id: coverLetterId },
    data: { content: generated.content },
    select: { ...coverLetterListSelect, content: true },
  });
}

// Rewrites the existing cover letter body to match a requested tone and
// optional free-text instructions, preserving the facts already present.
export async function rewriteCoverLetter(
  coverLetterId: string,
  userId: string,
  input: RewriteCoverLetterInput,
): Promise<CoverLetterItem> {
  const coverLetter = await getOwnedCoverLetterOrThrow(coverLetterId, userId);
  const { instructions, tone } = rewriteCoverLetterSchema.parse(input);

  if (!coverLetter.content.trim()) {
    throw new CoverLetterServiceError(
      "Generate or write content before rewriting.",
      400,
    );
  }

  const template = getPrompt("COVER_LETTER_REWRITE");
  const rewritten = await generateAIJSON({
    feature: "COVER_LETTER_REWRITE",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({
      currentContent: coverLetter.content,
      instructions,
      tone,
    }),
    schema: generatedCoverLetterSchema,
  });

  await createCoverLetterVersionSnapshot(
    coverLetterId,
    "Before AI cover letter rewrite",
  );

  return prisma.coverLetter.update({
    where: { id: coverLetterId },
    data: { content: rewritten.content },
    select: { ...coverLetterListSelect, content: true },
  });
}

// Tailors the existing cover letter body to a specific target job
// description, working in relevant keywords while preserving facts.
export async function customizeCoverLetter(
  coverLetterId: string,
  userId: string,
  input: CustomizeCoverLetterInput,
): Promise<CoverLetterItem> {
  const coverLetter = await getOwnedCoverLetterOrThrow(coverLetterId, userId);
  const { jobDescription, tone } = customizeCoverLetterSchema.parse(input);

  if (!coverLetter.content.trim()) {
    throw new CoverLetterServiceError(
      "Generate or write content before customizing.",
      400,
    );
  }

  const template = getPrompt("COVER_LETTER_CUSTOMIZE");
  const customized = await generateAIJSON({
    feature: "COVER_LETTER_CUSTOMIZE",
    userId,
    system: template.system,
    prompt: template.buildUserPrompt({
      currentContent: coverLetter.content,
      jobDescription,
      tone,
    }),
    schema: generatedCoverLetterSchema,
  });

  await createCoverLetterVersionSnapshot(
    coverLetterId,
    "Before AI cover letter customization",
  );

  return prisma.coverLetter.update({
    where: { id: coverLetterId },
    data: { content: customized.content },
    select: { ...coverLetterListSelect, content: true },
  });
}
