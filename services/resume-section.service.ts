import { createWithSequenceRetry, prisma } from "@/lib/prisma";
import type { ResumeSectionType } from "@/lib/enums";
import {
  getOwnedResumeOrThrow,
  ResumeServiceError,
} from "@/services/resume.service";
import {
  createSectionSchema,
  parseSectionContent,
  reorderSectionsSchema,
  updateSectionSchema,
  type CreateSectionInput,
  type ReorderSectionsInput,
  type ResumeSectionItem,
  type UpdateSectionInput,
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

async function getOwnedSectionOrThrow(
  resumeId: string,
  sectionId: string,
  userId: string,
) {
  await getOwnedResumeOrThrow(resumeId, userId);

  const section = await prisma.resumeSection.findUnique({
    where: { id: sectionId },
  });

  if (!section || section.resumeId !== resumeId) {
    throw new ResumeServiceError("Section not found.", 404);
  }

  return section;
}

export async function listSectionsForResume(resumeId: string, userId: string) {
  await getOwnedResumeOrThrow(resumeId, userId);

  const sections = await prisma.resumeSection.findMany({
    where: { resumeId },
    orderBy: { order: "asc" },
  });

  return sections.map(serializeSection);
}

export async function createSection(
  resumeId: string,
  userId: string,
  input: CreateSectionInput,
) {
  await getOwnedResumeOrThrow(resumeId, userId);
  const { type, content } = createSectionSchema.parse(input);
  const parsedContent = parseSectionContent(type, content);

  const section = await createWithSequenceRetry(async () => {
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
        content: JSON.stringify(parsedContent),
      },
    });
  });

  return serializeSection(section);
}

export async function updateSection(
  resumeId: string,
  sectionId: string,
  userId: string,
  input: UpdateSectionInput,
) {
  const existing = await getOwnedSectionOrThrow(resumeId, sectionId, userId);
  const { content, hidden } = updateSectionSchema.parse(input);

  const data: { content?: string; hidden?: boolean } = {};
  if (content !== undefined) {
    data.content = JSON.stringify(
      parseSectionContent(existing.type as ResumeSectionType, content),
    );
  }
  if (hidden !== undefined) {
    data.hidden = hidden;
  }

  const section = await prisma.resumeSection.update({
    where: { id: sectionId },
    data,
  });

  return serializeSection(section);
}

export async function deleteSection(
  resumeId: string,
  sectionId: string,
  userId: string,
) {
  await getOwnedSectionOrThrow(resumeId, sectionId, userId);

  await prisma.resumeSection.delete({ where: { id: sectionId } });
}

export async function reorderSections(
  resumeId: string,
  userId: string,
  input: ReorderSectionsInput,
) {
  await getOwnedResumeOrThrow(resumeId, userId);
  const { order } = reorderSectionsSchema.parse(input);

  const existing = await prisma.resumeSection.findMany({
    where: { resumeId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((section) => section.id));

  if (
    order.length !== existing.length ||
    !order.every((id) => existingIds.has(id))
  ) {
    throw new ResumeServiceError("Invalid section order.", 422);
  }

  // Two-phase update: first move every row to a temporary negative order
  // (guaranteed distinct from the final positive values and from each
  // other), then assign final positions. This avoids transiently violating
  // the (resumeId, order) unique constraint when the new ordering reuses
  // values already held by other rows (e.g. swapping positions 0 and 1).
  await prisma.$transaction([
    ...order.map((id, index) =>
      prisma.resumeSection.update({
        where: { id },
        data: { order: -(index + 1) },
      }),
    ),
    ...order.map((id, index) =>
      prisma.resumeSection.update({ where: { id }, data: { order: index } }),
    ),
  ]);

  return listSectionsForResume(resumeId, userId);
}
