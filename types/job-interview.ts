import { z } from "zod";

import {
  INTERVIEW_TYPES,
  JOB_INTERVIEW_STATUSES,
  MEETING_PLATFORMS,
  type InterviewType,
  type JobInterviewStatus,
  type MeetingPlatform,
} from "@/lib/enums";

export const createJobInterviewSchema = z.object({
  interviewType: z.enum(INTERVIEW_TYPES),
  scheduledDate: z.coerce.date().optional(),
  scheduledTime: z.string().trim().max(20).optional(),
  timezone: z.string().trim().max(60).optional(),
  meetingPlatform: z.enum(MEETING_PLATFORMS).optional(),
  meetingLink: z.string().trim().url().max(2000).optional(),
  interviewerName: z.string().trim().max(200).optional(),
  interviewerEmail: z.string().trim().email().max(200).optional(),
  location: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(4000).optional(),
});
export type CreateJobInterviewInput = z.infer<typeof createJobInterviewSchema>;

export const updateJobInterviewSchema = z
  .object({
    interviewType: z.enum(INTERVIEW_TYPES).optional(),
    status: z.enum(JOB_INTERVIEW_STATUSES).optional(),
    scheduledDate: z.coerce.date().nullable().optional(),
    scheduledTime: z.string().trim().max(20).nullable().optional(),
    timezone: z.string().trim().max(60).nullable().optional(),
    meetingPlatform: z.enum(MEETING_PLATFORMS).nullable().optional(),
    meetingLink: z.string().trim().url().max(2000).nullable().optional(),
    interviewerName: z.string().trim().max(200).nullable().optional(),
    interviewerEmail: z.string().trim().email().max(200).nullable().optional(),
    location: z.string().trim().max(200).nullable().optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
export type UpdateJobInterviewInput = z.infer<typeof updateJobInterviewSchema>;

export type JobInterviewItem = {
  id: string;
  applicationId: string;
  roundNumber: number;
  interviewType: InterviewType;
  status: JobInterviewStatus;
  scheduledDate: Date | null;
  scheduledTime: string | null;
  timezone: string | null;
  meetingPlatform: MeetingPlatform | null;
  meetingLink: string | null;
  interviewerName: string | null;
  interviewerEmail: string | null;
  location: string | null;
  notes: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
