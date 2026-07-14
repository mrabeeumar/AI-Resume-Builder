import { z } from "zod";

import {
  EMPLOYMENT_TYPES,
  JOB_APPLICATION_STATUSES,
  WORK_MODES,
  type EmploymentType,
  type JobApplicationSource,
  type JobApplicationStatus,
  type WorkMode,
} from "@/lib/enums";
import type { ParsedJobDescription } from "@/types/job-parser.schema";

export const createJobApplicationSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(200),
  position: z.string().trim().min(1, "Position is required").max(200),
  location: z.string().trim().max(200).optional(),
  salary: z.string().trim().max(120).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  workMode: z.enum(WORK_MODES).optional(),
  content: z.string().trim().max(8000).optional(),
  originalJobUrl: z.string().trim().url().max(2000).optional(),
  applicationDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  notes: z.string().trim().max(10000).optional(),
  resumeId: z.string().trim().min(1).optional(),
  resumeVersionId: z.string().trim().min(1).optional(),
  coverLetterId: z.string().trim().min(1).optional(),
  jobDescriptionId: z.string().trim().min(1).optional(),
});
export type CreateJobApplicationInput = z.infer<
  typeof createJobApplicationSchema
>;

export const importJobApplicationSchema = z.object({
  url: z.string().trim().url("A valid job posting URL is required").max(2000),
});
export type ImportJobApplicationInput = z.infer<
  typeof importJobApplicationSchema
>;

export const createFromTailoringSchema = z.object({
  resumeId: z.string().trim().min(1),
  resumeVersionId: z.string().trim().min(1),
  jobDescriptionId: z.string().trim().min(1).optional(),
  coverLetterId: z.string().trim().min(1).optional(),
  company: z.string().trim().min(1, "Company is required").max(200),
  position: z.string().trim().min(1, "Position is required").max(200),
});
export type CreateFromTailoringInput = z.infer<
  typeof createFromTailoringSchema
>;

export const updateJobApplicationSchema = z
  .object({
    company: z.string().trim().min(1).max(200).optional(),
    position: z.string().trim().min(1).max(200).optional(),
    location: z.string().trim().max(200).nullable().optional(),
    salary: z.string().trim().max(120).nullable().optional(),
    employmentType: z.enum(EMPLOYMENT_TYPES).nullable().optional(),
    workMode: z.enum(WORK_MODES).nullable().optional(),
    applicationDate: z.coerce.date().nullable().optional(),
    deadline: z.coerce.date().nullable().optional(),
    notes: z.string().trim().max(10000).nullable().optional(),
    resumeId: z.string().trim().min(1).nullable().optional(),
    resumeVersionId: z.string().trim().min(1).nullable().optional(),
    coverLetterId: z.string().trim().min(1).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
export type UpdateJobApplicationInput = z.infer<
  typeof updateJobApplicationSchema
>;

export const updateJobApplicationStatusSchema = z.object({
  status: z.enum(JOB_APPLICATION_STATUSES),
  notes: z.string().trim().max(500).optional(),
});
export type UpdateJobApplicationStatusInput = z.infer<
  typeof updateJobApplicationStatusSchema
>;

export const listJobApplicationsQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(JOB_APPLICATION_STATUSES).optional(),
  company: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
export type ListJobApplicationsQuery = z.infer<
  typeof listJobApplicationsQuerySchema
>;

export type JobApplicationListItem = {
  id: string;
  company: string;
  companyLogo: string | null;
  position: string;
  location: string | null;
  status: JobApplicationStatus;
  source: JobApplicationSource;
  applicationDate: Date | null;
  deadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type JobApplicationItem = JobApplicationListItem & {
  salary: string | null;
  employmentType: EmploymentType | null;
  workMode: WorkMode | null;
  originalJobUrl: string | null;
  parsedJobDescription: ParsedJobDescription | null;
  notes: string | null;
  resumeId: string | null;
  resumeVersionId: string | null;
  coverLetterId: string | null;
  jobDescriptionId: string | null;
};

export type ApplicationTimelineItem = {
  id: string;
  event: string;
  timestamp: Date;
  notes: string | null;
};

export type JobApplicationsListReply = {
  applications: JobApplicationListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type JobApplicationsDashboardData = {
  overview: {
    totalApplications: number;
    activeApplications: number;
    interviewsScheduled: number;
    offersReceived: number;
    rejections: number;
  };
  upcomingInterviews: {
    id: string;
    applicationId: string;
    company: string;
    position: string;
    roundNumber: number;
    interviewType: string;
    scheduledDate: Date;
    scheduledTime: string | null;
  }[];
  recentApplications: {
    id: string;
    company: string;
    position: string;
    status: JobApplicationStatus;
  }[];
};

export type JobApplicationAnalytics = {
  applicationsSubmitted: number;
  interviews: number;
  offers: number;
  rejections: number;
  acceptanceRate: number;
  interviewSuccessRate: number;
  averageInterviewScore: number | null;
  mostCommonSkillsRequested: { skill: string; count: number }[];
  mostAppliedPositions: { position: string; count: number }[];
  applicationsPerMonth: { month: string; count: number }[];
};
