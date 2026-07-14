import { createWithSequenceRetry, prisma } from "@/lib/prisma";
import {
  CoverLetterServiceError,
  getOwnedCoverLetterOrThrow,
} from "@/services/cover-letter.service";
import {
  createCoverLetterVersionSchema,
  type CoverLetterSnapshot,
  type CreateCoverLetterVersionInput,
  type CoverLetterVersionItem,
} from "@/types/cover-letter-version";

function serializeVersion(version: {
  id: string;
  coverLetterId: string;
  versionNumber: number;
  title: string;
  content: string;
  note: string | null;
  createdAt: Date;
}): CoverLetterVersionItem {
  return {
    id: version.id,
    coverLetterId: version.coverLetterId,
    versionNumber: version.versionNumber,
    note: version.note,
    createdAt: version.createdAt,
    content: { title: version.title, content: version.content } as CoverLetterSnapshot,
  };
}

// Snapshots the cover letter's current state into a new version. Called
// both from explicit "save version" requests and automatically before
// AI-driven overwrites (generate/rewrite/customize), mirroring the resume
// version pattern so cover letter history is never silently lost.
export async function createCoverLetterVersionSnapshot(
  coverLetterId: string,
  note?: string | null,
) {
  const coverLetter = await prisma.coverLetter.findUnique({
    where: { id: coverLetterId },
  });

  if (!coverLetter) {
    throw new CoverLetterServiceError("Cover letter not found.", 404);
  }

  return createWithSequenceRetry(async () => {
    const last = await prisma.coverLetterVersion.findFirst({
      where: { coverLetterId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    return prisma.coverLetterVersion.create({
      data: {
        coverLetterId,
        versionNumber: (last?.versionNumber ?? 0) + 1,
        title: coverLetter.title,
        content: coverLetter.content,
        note: note ?? null,
      },
    });
  });
}

export async function listVersionsForCoverLetter(
  coverLetterId: string,
  userId: string,
) {
  await getOwnedCoverLetterOrThrow(coverLetterId, userId);

  return prisma.coverLetterVersion.findMany({
    where: { coverLetterId },
    select: {
      id: true,
      coverLetterId: true,
      versionNumber: true,
      note: true,
      createdAt: true,
    },
    orderBy: { versionNumber: "desc" },
  });
}

async function getOwnedVersionOrThrow(
  coverLetterId: string,
  versionId: string,
  userId: string,
) {
  await getOwnedCoverLetterOrThrow(coverLetterId, userId);

  const version = await prisma.coverLetterVersion.findUnique({
    where: { id: versionId },
  });

  if (!version || version.coverLetterId !== coverLetterId) {
    throw new CoverLetterServiceError("Version not found.", 404);
  }

  return version;
}

export async function getVersionForCoverLetter(
  coverLetterId: string,
  versionId: string,
  userId: string,
) {
  const version = await getOwnedVersionOrThrow(coverLetterId, versionId, userId);

  return serializeVersion(version);
}

export async function createManualCoverLetterVersion(
  coverLetterId: string,
  userId: string,
  input: CreateCoverLetterVersionInput,
) {
  await getOwnedCoverLetterOrThrow(coverLetterId, userId);
  const { note } = createCoverLetterVersionSchema.parse(input);

  const version = await createCoverLetterVersionSnapshot(coverLetterId, note);

  return serializeVersion(version);
}

export async function restoreCoverLetterVersion(
  coverLetterId: string,
  versionId: string,
  userId: string,
) {
  const version = await getOwnedVersionOrThrow(coverLetterId, versionId, userId);

  // Preserve the state being replaced so the restore itself can be undone.
  await createCoverLetterVersionSnapshot(
    coverLetterId,
    `Before restoring to version ${version.versionNumber}`,
  );

  return prisma.coverLetter.update({
    where: { id: coverLetterId },
    data: { title: version.title, content: version.content },
  });
}

export async function compareCoverLetterVersions(
  coverLetterId: string,
  fromVersionId: string,
  toVersionId: string,
  userId: string,
) {
  const [from, to] = await Promise.all([
    getOwnedVersionOrThrow(coverLetterId, fromVersionId, userId),
    getOwnedVersionOrThrow(coverLetterId, toVersionId, userId),
  ]);

  return { from: serializeVersion(from), to: serializeVersion(to) };
}
