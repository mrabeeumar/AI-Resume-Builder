import { createWithSequenceRetry, prisma } from "@/lib/prisma";
import type {
  PageSize,
  ResumePageColor,
  ResumeSectionType,
  ResumeTemplateId,
  ResumeThemeColor,
} from "@/lib/enums";
import { getOwnedResumeOrThrow, ResumeServiceError } from "@/services/resume.service";
import {
  createVersionSchema,
  type CreateVersionInput,
  type ResumeSnapshot,
  type ResumeVersionItem,
  type ResumeVersionListItem,
} from "@/types/resume-version";

function serializeVersion(version: {
  id: string;
  resumeId: string;
  versionNumber: number;
  content: string;
  note: string | null;
  createdAt: Date;
}): ResumeVersionItem {
  return {
    id: version.id,
    resumeId: version.resumeId,
    versionNumber: version.versionNumber,
    note: version.note,
    createdAt: version.createdAt,
    content: JSON.parse(version.content) as ResumeSnapshot,
  };
}

async function buildSnapshot(resumeId: string): Promise<ResumeSnapshot> {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!resume) {
    throw new ResumeServiceError("Resume not found.", 404);
  }

  return {
    title: resume.title,
    status: resume.status,
    templateId: resume.templateId as ResumeTemplateId,
    themeColor: resume.themeColor as ResumeThemeColor,
    pageColor: resume.pageColor as ResumePageColor,
    pageSize: resume.pageSize as PageSize,
    sections: resume.sections.map((section) => ({
      type: section.type as ResumeSectionType,
      order: section.order,
      hidden: section.hidden,
      content: JSON.parse(section.content),
    })),
  };
}

// Snapshots the resume's current state into a new version. Called both from
// explicit "save version" requests and automatically before major edits so
// prior content is never overwritten (see .claude/docs/databse.md).
export async function createVersionSnapshot(resumeId: string, note?: string | null) {
  const snapshot = await buildSnapshot(resumeId);

  return createWithSequenceRetry(async () => {
    const last = await prisma.resumeVersion.findFirst({
      where: { resumeId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    return prisma.resumeVersion.create({
      data: {
        resumeId,
        versionNumber: (last?.versionNumber ?? 0) + 1,
        content: JSON.stringify(snapshot),
        note: note ?? null,
      },
    });
  });
}

export async function listVersionsForResume(
  resumeId: string,
  userId: string,
): Promise<ResumeVersionListItem[]> {
  await getOwnedResumeOrThrow(resumeId, userId);

  return prisma.resumeVersion.findMany({
    where: { resumeId },
    select: {
      id: true,
      resumeId: true,
      versionNumber: true,
      note: true,
      createdAt: true,
    },
    orderBy: { versionNumber: "desc" },
  });
}

async function getOwnedVersionOrThrow(
  resumeId: string,
  versionId: string,
  userId: string,
) {
  await getOwnedResumeOrThrow(resumeId, userId);

  const version = await prisma.resumeVersion.findUnique({
    where: { id: versionId },
  });

  if (!version || version.resumeId !== resumeId) {
    throw new ResumeServiceError("Version not found.", 404);
  }

  return version;
}

export async function getVersionForResume(
  resumeId: string,
  versionId: string,
  userId: string,
) {
  const version = await getOwnedVersionOrThrow(resumeId, versionId, userId);

  return serializeVersion(version);
}

export async function createManualVersion(
  resumeId: string,
  userId: string,
  input: CreateVersionInput,
) {
  await getOwnedResumeOrThrow(resumeId, userId);
  const { note } = createVersionSchema.parse(input);

  const version = await createVersionSnapshot(resumeId, note);

  return serializeVersion(version);
}

export async function restoreVersion(
  resumeId: string,
  versionId: string,
  userId: string,
) {
  const version = await getOwnedVersionOrThrow(resumeId, versionId, userId);
  const snapshot = JSON.parse(version.content) as ResumeSnapshot;

  // Preserve the state being replaced so the restore itself can be undone.
  await createVersionSnapshot(
    resumeId,
    `Before restoring to version ${version.versionNumber}`,
  );

  await prisma.$transaction([
    prisma.resumeSection.deleteMany({ where: { resumeId } }),
    prisma.resume.update({
      where: { id: resumeId },
      data: {
        title: snapshot.title,
        status: snapshot.status,
        templateId: snapshot.templateId,
        themeColor: snapshot.themeColor,
        pageColor: snapshot.pageColor,
        pageSize: snapshot.pageSize,
      },
    }),
    ...snapshot.sections.map((section) =>
      prisma.resumeSection.create({
        data: {
          resumeId,
          type: section.type,
          order: section.order,
          hidden: section.hidden,
          content: JSON.stringify(section.content),
        },
      }),
    ),
  ]);

  return prisma.resume.findUnique({
    where: { id: resumeId },
    include: { sections: { orderBy: { order: "asc" } } },
  });
}

export async function deleteVersion(
  resumeId: string,
  versionId: string,
  userId: string,
) {
  await getOwnedVersionOrThrow(resumeId, versionId, userId);

  const versionCount = await prisma.resumeVersion.count({
    where: { resumeId },
  });

  if (versionCount <= 1) {
    throw new ResumeServiceError(
      "Cannot delete the only remaining version.",
      422,
    );
  }

  await prisma.resumeVersion.delete({ where: { id: versionId } });
}

export async function compareVersions(
  resumeId: string,
  fromVersionId: string,
  toVersionId: string,
  userId: string,
) {
  const [from, to] = await Promise.all([
    getOwnedVersionOrThrow(resumeId, fromVersionId, userId),
    getOwnedVersionOrThrow(resumeId, toVersionId, userId),
  ]);

  return { from: serializeVersion(from), to: serializeVersion(to) };
}
