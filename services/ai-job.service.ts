import type { AiJob } from "@prisma/client";

import type { AiJobType } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { getOwnedResumeOrThrow } from "@/services/resume.service";

export type AiJobDTO = {
  id: string;
  resumeId: string;
  type: string;
  status: string;
  result: unknown;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toDTO(job: AiJob): AiJobDTO {
  return {
    id: job.id,
    resumeId: job.resumeId,
    type: job.type,
    status: job.status,
    result: job.result ? JSON.parse(job.result) : null,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export async function createAiJob(
  resumeId: string,
  userId: string,
  type: AiJobType,
  input: unknown,
): Promise<AiJobDTO> {
  await getOwnedResumeOrThrow(resumeId, userId);

  const job = await prisma.aiJob.create({
    data: {
      resumeId,
      userId,
      type,
      status: "PENDING",
      input: JSON.stringify(input ?? {}),
    },
  });

  return toDTO(job);
}

export async function markAiJobProcessing(jobId: string): Promise<void> {
  await prisma.aiJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING" },
  });
}

export async function markAiJobCompleted(
  jobId: string,
  result: unknown,
): Promise<void> {
  await prisma.aiJob.update({
    where: { id: jobId },
    data: { status: "COMPLETED", result: JSON.stringify(result) },
  });
}

export async function markAiJobFailed(
  jobId: string,
  error: string,
): Promise<void> {
  await prisma.aiJob.update({
    where: { id: jobId },
    data: { status: "FAILED", error },
  });
}

class AiJobServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function getOwnedAiJob(
  jobId: string,
  userId: string,
): Promise<AiJobDTO> {
  const job = await prisma.aiJob.findUnique({ where: { id: jobId } });

  if (!job || job.userId !== userId) {
    throw new AiJobServiceError("Job not found.", 404);
  }

  return toDTO(job);
}

export async function listActiveAiJobsForUser(
  userId: string,
): Promise<AiJobDTO[]> {
  const jobs = await prisma.aiJob.findMany({
    where: { userId, status: { in: ["PENDING", "PROCESSING"] } },
    orderBy: { createdAt: "desc" },
  });

  return jobs.map(toDTO);
}
