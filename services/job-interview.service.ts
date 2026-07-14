import type { InterviewType, JobInterviewStatus } from "@/lib/enums";
import { createWithSequenceRetry, prisma } from "@/lib/prisma";
import { getOwnedJobApplicationOrThrow } from "@/services/job-application.service";
import {
  createJobInterviewSchema,
  updateJobInterviewSchema,
  type CreateJobInterviewInput,
  type JobInterviewItem,
  type UpdateJobInterviewInput,
} from "@/types/job-interview";

export class JobInterviewServiceError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "JobInterviewServiceError";
  }
}

function serialize(
  interview: NonNullable<
    Awaited<ReturnType<typeof prisma.jobInterview.findUnique>>
  >,
): JobInterviewItem {
  return {
    id: interview.id,
    applicationId: interview.applicationId,
    roundNumber: interview.roundNumber,
    interviewType: interview.interviewType as InterviewType,
    status: interview.status as JobInterviewStatus,
    scheduledDate: interview.scheduledDate,
    scheduledTime: interview.scheduledTime,
    timezone: interview.timezone,
    meetingPlatform: interview.meetingPlatform as JobInterviewItem["meetingPlatform"],
    meetingLink: interview.meetingLink,
    interviewerName: interview.interviewerName,
    interviewerEmail: interview.interviewerEmail,
    location: interview.location,
    notes: interview.notes,
    completedAt: interview.completedAt,
    createdAt: interview.createdAt,
    updatedAt: interview.updatedAt,
  };
}

export async function getOwnedJobInterviewOrThrow(
  interviewId: string,
  userId: string,
) {
  const interview = await prisma.jobInterview.findUnique({
    where: { id: interviewId },
    include: { application: true },
  });

  if (!interview || interview.application.userId !== userId) {
    throw new JobInterviewServiceError("Interview not found.", 404);
  }

  return interview;
}

export async function listInterviewsForApplication(
  applicationId: string,
  userId: string,
): Promise<JobInterviewItem[]> {
  await getOwnedJobApplicationOrThrow(applicationId, userId);

  const interviews = await prisma.jobInterview.findMany({
    where: { applicationId },
    orderBy: { roundNumber: "asc" },
  });

  return interviews.map(serialize);
}

// There is no limit on interview rounds per application (see roadmap M21
// "Interview Tracking"); the round number is assigned sequentially.
export async function createJobInterview(
  applicationId: string,
  input: CreateJobInterviewInput,
  userId: string,
): Promise<JobInterviewItem> {
  const data = createJobInterviewSchema.parse(input);
  await getOwnedJobApplicationOrThrow(applicationId, userId);

  const interview = await createWithSequenceRetry(async () => {
    const lastRound = await prisma.jobInterview.findFirst({
      where: { applicationId },
      orderBy: { roundNumber: "desc" },
      select: { roundNumber: true },
    });

    return prisma.jobInterview.create({
      data: {
        applicationId,
        roundNumber: (lastRound?.roundNumber ?? 0) + 1,
        interviewType: data.interviewType,
        status: data.scheduledDate ? "SCHEDULED" : "PENDING",
        scheduledDate: data.scheduledDate ?? null,
        scheduledTime: data.scheduledTime ?? null,
        timezone: data.timezone ?? null,
        meetingPlatform: data.meetingPlatform ?? null,
        meetingLink: data.meetingLink ?? null,
        interviewerName: data.interviewerName ?? null,
        interviewerEmail: data.interviewerEmail ?? null,
        location: data.location ?? null,
        notes: data.notes ?? null,
      },
    });
  });

  await prisma.applicationTimeline.create({
    data: {
      applicationId,
      event: "INTERVIEW_SCHEDULED",
      notes: `Round ${interview.roundNumber} (${data.interviewType}) added.`,
    },
  });

  return serialize(interview);
}

export async function updateJobInterview(
  interviewId: string,
  input: UpdateJobInterviewInput,
  userId: string,
): Promise<JobInterviewItem> {
  const data = updateJobInterviewSchema.parse(input);
  const existing = await getOwnedJobInterviewOrThrow(interviewId, userId);

  const interview = await prisma.jobInterview.update({
    where: { id: interviewId },
    data: {
      ...data,
      completedAt: data.status === "COMPLETED" ? new Date() : undefined,
    },
  });

  if (data.status && data.status !== existing.status) {
    await prisma.applicationTimeline.create({
      data: {
        applicationId: existing.applicationId,
        event:
          data.status === "COMPLETED"
            ? "INTERVIEW_COMPLETED"
            : "STATUS_UPDATED",
        notes: `Round ${existing.roundNumber} interview status changed to ${data.status}.`,
      },
    });
  }

  return serialize(interview);
}

export async function deleteJobInterview(
  interviewId: string,
  userId: string,
): Promise<void> {
  await getOwnedJobInterviewOrThrow(interviewId, userId);

  await prisma.jobInterview.delete({ where: { id: interviewId } });
}
