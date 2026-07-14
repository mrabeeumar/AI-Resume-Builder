import { prisma } from "@/lib/prisma";
import {
  createJobDescriptionSchema,
  updateJobDescriptionSchema,
  type CreateJobDescriptionInput,
  type UpdateJobDescriptionInput,
} from "@/types/job-description";

export class JobDescriptionServiceError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "JobDescriptionServiceError";
  }
}

const jobDescriptionListSelect = {
  id: true,
  title: true,
  company: true,
  source: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getOwnedJobDescriptionOrThrow(
  jobDescriptionId: string,
  userId: string,
) {
  const jobDescription = await prisma.jobDescription.findUnique({
    where: { id: jobDescriptionId },
  });

  if (!jobDescription || jobDescription.userId !== userId) {
    throw new JobDescriptionServiceError("Job description not found.", 404);
  }

  return jobDescription;
}

export async function listJobDescriptionsForUser(userId: string) {
  return prisma.jobDescription.findMany({
    where: { userId },
    select: jobDescriptionListSelect,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getJobDescriptionForUser(
  jobDescriptionId: string,
  userId: string,
) {
  return getOwnedJobDescriptionOrThrow(jobDescriptionId, userId);
}

export async function createJobDescription(
  input: CreateJobDescriptionInput,
  userId: string,
) {
  const { title, company, content, source } =
    createJobDescriptionSchema.parse(input);

  return prisma.jobDescription.create({
    data: { title, company: company || null, content, source, userId },
  });
}

export async function updateJobDescription(
  jobDescriptionId: string,
  input: UpdateJobDescriptionInput,
  userId: string,
) {
  const { title, company, content } = updateJobDescriptionSchema.parse(input);
  await getOwnedJobDescriptionOrThrow(jobDescriptionId, userId);

  return prisma.jobDescription.update({
    where: { id: jobDescriptionId },
    data: { title, company, content },
  });
}

// Cover letters referencing this job description have their reference
// cleared first: the FK uses NoAction (SQL Server disallows multiple
// cascading paths reaching the same table), so cascading must happen here.
export async function deleteJobDescription(
  jobDescriptionId: string,
  userId: string,
) {
  await getOwnedJobDescriptionOrThrow(jobDescriptionId, userId);

  await prisma.$transaction([
    prisma.coverLetter.updateMany({
      where: { jobDescriptionId },
      data: { jobDescriptionId: null },
    }),
    prisma.skillGapAnalysis.updateMany({
      where: { jobDescriptionId },
      data: { jobDescriptionId: null },
    }),
    prisma.jobDescription.delete({ where: { id: jobDescriptionId } }),
  ]);
}
