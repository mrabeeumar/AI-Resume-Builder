import type { Prisma } from "@prisma/client";

import type { JobApplicationStatus } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { getOwnedCoverLetterOrThrow } from "@/services/cover-letter.service";
import { getOwnedJobDescriptionOrThrow } from "@/services/job-description.service";
import { getOwnedResumeOrThrow } from "@/services/resume.service";
import { getVersionForResume } from "@/services/resume-version.service";
import {
  createFromTailoringSchema,
  createJobApplicationSchema,
  listJobApplicationsQuerySchema,
  updateJobApplicationSchema,
  updateJobApplicationStatusSchema,
  type CreateFromTailoringInput,
  type CreateJobApplicationInput,
  type JobApplicationItem,
  type JobApplicationListItem,
  type JobApplicationsListReply,
  type ListJobApplicationsQuery,
  type UpdateJobApplicationInput,
  type UpdateJobApplicationStatusInput,
} from "@/types/job-application";
import type { ParsedJobDescription } from "@/types/job-parser.schema";

export class JobApplicationServiceError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "JobApplicationServiceError";
  }
}

// Statuses that count as "active" (not a terminal outcome) for the
// dashboard's "Active Applications" stat (see roadmap M21 "Dashboard
// Integration").
const TERMINAL_STATUSES: JobApplicationStatus[] = [
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "ARCHIVED",
];

const listSelect = {
  id: true,
  company: true,
  companyLogo: true,
  position: true,
  location: true,
  status: true,
  source: true,
  applicationDate: true,
  deadline: true,
  createdAt: true,
  updatedAt: true,
} as const;

function serializeItem(
  application: NonNullable<
    Awaited<ReturnType<typeof prisma.jobApplication.findUnique>>
  >,
): JobApplicationItem {
  return {
    id: application.id,
    company: application.company,
    companyLogo: application.companyLogo,
    position: application.position,
    location: application.location,
    status: application.status as JobApplicationStatus,
    source: application.source as JobApplicationItem["source"],
    applicationDate: application.applicationDate,
    deadline: application.deadline,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    salary: application.salary,
    employmentType: application.employmentType as JobApplicationItem["employmentType"],
    workMode: application.workMode as JobApplicationItem["workMode"],
    originalJobUrl: application.originalJobUrl,
    parsedJobDescription: application.parsedJobDescription
      ? (JSON.parse(application.parsedJobDescription) as ParsedJobDescription)
      : null,
    notes: application.notes,
    resumeId: application.resumeId,
    resumeVersionId: application.resumeVersionId,
    coverLetterId: application.coverLetterId,
    jobDescriptionId: application.jobDescriptionId,
  };
}

export async function getOwnedJobApplicationOrThrow(
  applicationId: string,
  userId: string,
) {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application || application.userId !== userId) {
    throw new JobApplicationServiceError("Application not found.", 404);
  }

  return application;
}

async function addTimelineEvent(
  applicationId: string,
  event: string,
  notes?: string | null,
) {
  await prisma.applicationTimeline.create({
    data: { applicationId, event, notes: notes ?? null },
  });
}

export async function listJobApplicationsForUser(
  userId: string,
  query: ListJobApplicationsQuery,
): Promise<JobApplicationsListReply> {
  const { search, status, company, page, limit } =
    listJobApplicationsQuerySchema.parse(query);

  const where: Prisma.JobApplicationWhereInput = {
    userId,
    ...(status ? { status } : {}),
    ...(company ? { company: { contains: company } } : {}),
    ...(search
      ? {
          OR: [
            { company: { contains: search } },
            { position: { contains: search } },
            { location: { contains: search } },
          ],
        }
      : {}),
  };

  const [applications, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      select: listSelect,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.jobApplication.count({ where }),
  ]);

  return {
    applications: applications.map((application) => ({
      ...application,
      status: application.status as JobApplicationStatus,
      source: application.source as JobApplicationListItem["source"],
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getJobApplicationForUser(
  applicationId: string,
  userId: string,
): Promise<JobApplicationItem> {
  const application = await getOwnedJobApplicationOrThrow(
    applicationId,
    userId,
  );

  return serializeItem(application);
}

export async function createJobApplication(
  input: CreateJobApplicationInput,
  userId: string,
): Promise<JobApplicationItem> {
  const data = createJobApplicationSchema.parse(input);

  if (data.resumeId) await getOwnedResumeOrThrow(data.resumeId, userId);
  if (data.resumeId && data.resumeVersionId) {
    await getVersionForResume(data.resumeId, data.resumeVersionId, userId);
  }
  if (data.coverLetterId) {
    await getOwnedCoverLetterOrThrow(data.coverLetterId, userId);
  }
  if (data.jobDescriptionId) {
    await getOwnedJobDescriptionOrThrow(data.jobDescriptionId, userId);
  }

  const application = await prisma.jobApplication.create({
    data: {
      userId,
      company: data.company,
      position: data.position,
      location: data.location ?? null,
      salary: data.salary ?? null,
      employmentType: data.employmentType ?? null,
      workMode: data.workMode ?? null,
      source: "MANUAL",
      originalJobUrl: data.originalJobUrl ?? null,
      parsedJobDescription: data.content
        ? JSON.stringify({ rawContent: data.content })
        : null,
      applicationDate: data.applicationDate ?? null,
      deadline: data.deadline ?? null,
      notes: data.notes ?? null,
      resumeId: data.resumeId ?? null,
      resumeVersionId: data.resumeVersionId ?? null,
      coverLetterId: data.coverLetterId ?? null,
      jobDescriptionId: data.jobDescriptionId ?? null,
    },
  });

  await addTimelineEvent(application.id, "STATUS_UPDATED", "Application created.");

  return serializeItem(application);
}

// Inherits the resume version, job description, company/position, and
// cover letter from a previously saved tailored resume, so no duplicate
// work is required (see roadmap M21 "Method 3 — Create From Resume
// Tailoring").
export async function createJobApplicationFromTailoring(
  input: CreateFromTailoringInput,
  userId: string,
): Promise<JobApplicationItem> {
  const data = createFromTailoringSchema.parse(input);

  await getOwnedResumeOrThrow(data.resumeId, userId);
  await getVersionForResume(data.resumeId, data.resumeVersionId, userId);
  if (data.jobDescriptionId) {
    await getOwnedJobDescriptionOrThrow(data.jobDescriptionId, userId);
  }
  if (data.coverLetterId) {
    await getOwnedCoverLetterOrThrow(data.coverLetterId, userId);
  }

  const application = await prisma.jobApplication.create({
    data: {
      userId,
      company: data.company,
      position: data.position,
      source: "TAILORING",
      resumeId: data.resumeId,
      resumeVersionId: data.resumeVersionId,
      jobDescriptionId: data.jobDescriptionId ?? null,
      coverLetterId: data.coverLetterId ?? null,
    },
  });

  await addTimelineEvent(
    application.id,
    "STATUS_UPDATED",
    "Application created from a tailored resume.",
  );

  return serializeItem(application);
}

export async function updateJobApplication(
  applicationId: string,
  input: UpdateJobApplicationInput,
  userId: string,
): Promise<JobApplicationItem> {
  const data = updateJobApplicationSchema.parse(input);
  await getOwnedJobApplicationOrThrow(applicationId, userId);

  if (data.resumeId) await getOwnedResumeOrThrow(data.resumeId, userId);
  if (data.resumeId && data.resumeVersionId) {
    await getVersionForResume(data.resumeId, data.resumeVersionId, userId);
  }
  if (data.coverLetterId) {
    await getOwnedCoverLetterOrThrow(data.coverLetterId, userId);
  }

  const notesChanged = data.notes !== undefined;

  const application = await prisma.jobApplication.update({
    where: { id: applicationId },
    data,
  });

  if (notesChanged) {
    await addTimelineEvent(applicationId, "NOTE_ADDED", "Notes updated.");
  }

  return serializeItem(application);
}

export async function updateJobApplicationStatus(
  applicationId: string,
  input: UpdateJobApplicationStatusInput,
  userId: string,
): Promise<JobApplicationItem> {
  const { status, notes } = updateJobApplicationStatusSchema.parse(input);
  await getOwnedJobApplicationOrThrow(applicationId, userId);

  const application = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status },
  });

  const event: string =
    status === "REJECTED"
      ? "REJECTED"
      : status === "WITHDRAWN"
        ? "WITHDRAWN"
        : status === "OFFER_RECEIVED"
          ? "OFFER_RECEIVED"
          : status === "INTERVIEW_SCHEDULED"
            ? "INTERVIEW_SCHEDULED"
            : "STATUS_UPDATED";

  await addTimelineEvent(
    applicationId,
    event,
    notes ?? `Status changed to ${status}.`,
  );

  return serializeItem(application);
}

// Resume/ResumeVersion/CoverLetter/JobDescription references use NoAction
// (see prisma/schema.prisma comment on JobApplication), so no cascading
// cleanup is required here beyond the application's own rows, which cascade
// automatically (JobInterview, ApplicationTimeline).
export async function deleteJobApplication(
  applicationId: string,
  userId: string,
): Promise<void> {
  await getOwnedJobApplicationOrThrow(applicationId, userId);

  await prisma.jobApplication.delete({ where: { id: applicationId } });
}

const UPCOMING_INTERVIEWS_LIMIT = 5;
const RECENT_APPLICATIONS_LIMIT = 5;

// Powers the Dashboard "Applications Overview" / "Upcoming Interviews" /
// "Recent Applications" widgets (see roadmap M21 "Dashboard Integration").
export async function getJobApplicationsDashboardData(userId: string) {
  const [applications, upcomingInterviews, recentApplications] =
    await Promise.all([
      prisma.jobApplication.findMany({
        where: { userId },
        select: { status: true },
      }),
      prisma.jobInterview.findMany({
        where: {
          application: { userId },
          scheduledDate: { gte: new Date() },
          status: { in: ["SCHEDULED", "RESCHEDULED"] },
        },
        include: { application: { select: { company: true, position: true } } },
        orderBy: { scheduledDate: "asc" },
        take: UPCOMING_INTERVIEWS_LIMIT,
      }),
      prisma.jobApplication.findMany({
        where: { userId },
        select: { id: true, company: true, position: true, status: true },
        orderBy: { updatedAt: "desc" },
        take: RECENT_APPLICATIONS_LIMIT,
      }),
    ]);

  const interviewsScheduled = applications.filter(
    (application) => application.status === "INTERVIEW_SCHEDULED",
  ).length;
  const offersReceived = applications.filter(
    (application) => application.status === "OFFER_RECEIVED",
  ).length;
  const rejections = applications.filter(
    (application) => application.status === "REJECTED",
  ).length;
  const activeApplications = applications.filter(
    (application) =>
      !(TERMINAL_STATUSES as string[]).includes(application.status),
  ).length;

  return {
    overview: {
      totalApplications: applications.length,
      activeApplications,
      interviewsScheduled,
      offersReceived,
      rejections,
    },
    upcomingInterviews: upcomingInterviews.map((interview) => ({
      id: interview.id,
      applicationId: interview.applicationId,
      company: interview.application.company,
      position: interview.application.position,
      roundNumber: interview.roundNumber,
      interviewType: interview.interviewType,
      scheduledDate: interview.scheduledDate as Date,
      scheduledTime: interview.scheduledTime,
    })),
    recentApplications: recentApplications.map((application) => ({
      id: application.id,
      company: application.company,
      position: application.position,
      status: application.status as JobApplicationStatus,
    })),
  };
}

export async function listApplicationTimeline(
  applicationId: string,
  userId: string,
) {
  await getOwnedJobApplicationOrThrow(applicationId, userId);

  return prisma.applicationTimeline.findMany({
    where: { applicationId },
    orderBy: { timestamp: "asc" },
  });
}

export { TERMINAL_STATUSES };
