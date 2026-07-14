import { prisma } from "@/lib/prisma";
import { assertCanCreateResume } from "@/services/subscription.service";
import {
  createResumeSchema,
  updateResumeSchema,
  type CreateResumeInput,
  type UpdateResumeInput,
} from "@/types/resume";

export class ResumeServiceError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "ResumeServiceError";
  }
}

const resumeListSelect = {
  id: true,
  title: true,
  status: true,
  templateId: true,
  themeColor: true,
  pageColor: true,
  pageSize: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getOwnedResumeOrThrow(resumeId: string, userId: string) {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
  });

  if (!resume || resume.userId !== userId) {
    throw new ResumeServiceError("Resume not found.", 404);
  }

  return resume;
}

export async function listResumesForUser(userId: string) {
  return prisma.resume.findMany({
    where: { userId },
    select: resumeListSelect,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getResumeForUser(resumeId: string, userId: string) {
  const resume = await getOwnedResumeOrThrow(resumeId, userId);

  return prisma.resume.findUnique({
    where: { id: resume.id },
    include: { sections: { orderBy: { order: "asc" } } },
  });
}

export async function createResume(input: CreateResumeInput, userId: string) {
  const { title } = createResumeSchema.parse(input);
  await assertCanCreateResume(userId);

  return prisma.resume.create({
    data: { title, userId },
    select: resumeListSelect,
  });
}

export async function updateResume(
  resumeId: string,
  input: UpdateResumeInput,
  userId: string,
) {
  const { title, status, templateId, themeColor, pageColor, pageSize } =
    updateResumeSchema.parse(input);
  await getOwnedResumeOrThrow(resumeId, userId);

  return prisma.resume.update({
    where: { id: resumeId },
    data: { title, status, templateId, themeColor, pageColor, pageSize },
    select: resumeListSelect,
  });
}

export async function deleteResume(resumeId: string, userId: string) {
  const resume = await getOwnedResumeOrThrow(resumeId, userId);

  await prisma.$transaction([
    prisma.coverLetter.updateMany({
      where: { resumeId: resume.id },
      data: { resumeId: null },
    }),
    // AiJob.resume uses NoAction (see schema comment) to avoid a multi-path
    // cascade conflict with AiJob.user, so it isn't deleted automatically.
    prisma.aiJob.deleteMany({ where: { resumeId: resume.id } }),
    prisma.resume.delete({ where: { id: resume.id } }),
  ]);
}

export async function duplicateResume(resumeId: string, userId: string) {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: { sections: true },
  });

  if (!resume || resume.userId !== userId) {
    throw new ResumeServiceError("Resume not found.", 404);
  }

  return prisma.resume.create({
    data: {
      title: `${resume.title} (Copy)`,
      status: "DRAFT",
      templateId: resume.templateId,
      themeColor: resume.themeColor,
      pageColor: resume.pageColor,
      pageSize: resume.pageSize,
      userId,
      sections: {
        create: resume.sections.map((section) => ({
          type: section.type,
          order: section.order,
          content: section.content,
        })),
      },
    },
    select: resumeListSelect,
  });
}
