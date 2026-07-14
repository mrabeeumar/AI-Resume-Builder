import { beforeEach, describe, expect, it, vi } from "vitest";

const getOwnedJobApplicationOrThrowMock = vi.fn();
vi.mock("@/services/job-application.service", () => ({
  getOwnedJobApplicationOrThrow: (...args: unknown[]) =>
    getOwnedJobApplicationOrThrowMock(...args),
}));

const jobInterviewFindUniqueMock = vi.fn();
const jobInterviewFindManyMock = vi.fn();
const jobInterviewFindFirstMock = vi.fn();
const jobInterviewCreateMock = vi.fn();
const jobInterviewUpdateMock = vi.fn();
const jobInterviewDeleteMock = vi.fn();
const applicationTimelineCreateMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    jobInterview: {
      findUnique: (...args: unknown[]) => jobInterviewFindUniqueMock(...args),
      findMany: (...args: unknown[]) => jobInterviewFindManyMock(...args),
      findFirst: (...args: unknown[]) => jobInterviewFindFirstMock(...args),
      create: (...args: unknown[]) => jobInterviewCreateMock(...args),
      update: (...args: unknown[]) => jobInterviewUpdateMock(...args),
      delete: (...args: unknown[]) => jobInterviewDeleteMock(...args),
    },
    applicationTimeline: {
      create: (...args: unknown[]) => applicationTimelineCreateMock(...args),
    },
  },
}));

const {
  createJobInterview,
  deleteJobInterview,
  getOwnedJobInterviewOrThrow,
  JobInterviewServiceError,
  listInterviewsForApplication,
  updateJobInterview,
} = await import("@/services/job-interview.service");

function dbInterview(overrides: Record<string, unknown> = {}) {
  return {
    id: "interview-1",
    applicationId: "app-1",
    roundNumber: 1,
    interviewType: "TECHNICAL",
    status: "PENDING",
    scheduledDate: null,
    scheduledTime: null,
    timezone: null,
    meetingPlatform: null,
    meetingLink: null,
    interviewerName: null,
    interviewerEmail: null,
    location: null,
    notes: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("job-interview.service", () => {
  beforeEach(() => {
    getOwnedJobApplicationOrThrowMock.mockReset();
    jobInterviewFindUniqueMock.mockReset();
    jobInterviewFindManyMock.mockReset();
    jobInterviewFindFirstMock.mockReset();
    jobInterviewCreateMock.mockReset();
    jobInterviewUpdateMock.mockReset();
    jobInterviewDeleteMock.mockReset();
    applicationTimelineCreateMock.mockReset();
  });

  describe("getOwnedJobInterviewOrThrow", () => {
    it("throws 404 when the parent application isn't owned by the user", async () => {
      jobInterviewFindUniqueMock.mockResolvedValue({
        ...dbInterview(),
        application: { userId: "someone-else" },
      });

      await expect(
        getOwnedJobInterviewOrThrow("interview-1", "user-1"),
      ).rejects.toMatchObject({ status: 404 });
    });

    it("throws JobInterviewServiceError when the interview does not exist", async () => {
      jobInterviewFindUniqueMock.mockResolvedValue(null);

      await expect(
        getOwnedJobInterviewOrThrow("interview-1", "user-1"),
      ).rejects.toThrow(JobInterviewServiceError);
    });
  });

  describe("createJobInterview", () => {
    it("assigns sequential round numbers with no limit", async () => {
      jobInterviewFindFirstMock.mockResolvedValue({ roundNumber: 2 });
      jobInterviewCreateMock.mockResolvedValue(dbInterview({ roundNumber: 3 }));

      const result = await createJobInterview(
        "app-1",
        { interviewType: "HR" },
        "user-1",
      );

      expect(getOwnedJobApplicationOrThrowMock).toHaveBeenCalledWith(
        "app-1",
        "user-1",
      );
      expect(jobInterviewCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ roundNumber: 3, status: "PENDING" }),
        }),
      );
      expect(result.roundNumber).toBe(3);
      expect(applicationTimelineCreateMock).toHaveBeenCalledOnce();
    });

    it("marks the round SCHEDULED when a date is provided", async () => {
      jobInterviewFindFirstMock.mockResolvedValue(null);
      jobInterviewCreateMock.mockResolvedValue(dbInterview({ status: "SCHEDULED" }));

      await createJobInterview(
        "app-1",
        { interviewType: "TECHNICAL", scheduledDate: new Date() },
        "user-1",
      );

      expect(jobInterviewCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "SCHEDULED" }),
        }),
      );
    });
  });

  describe("updateJobInterview", () => {
    it("stamps completedAt when the status transitions to COMPLETED", async () => {
      jobInterviewFindUniqueMock.mockResolvedValue({
        ...dbInterview(),
        application: { userId: "user-1" },
      });
      jobInterviewUpdateMock.mockResolvedValue(
        dbInterview({ status: "COMPLETED", completedAt: new Date() }),
      );

      await updateJobInterview("interview-1", { status: "COMPLETED" }, "user-1");

      expect(jobInterviewUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "COMPLETED",
            completedAt: expect.any(Date),
          }),
        }),
      );
      expect(applicationTimelineCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ event: "INTERVIEW_COMPLETED" }),
        }),
      );
    });
  });

  describe("listInterviewsForApplication", () => {
    it("orders interviews by round number", async () => {
      jobInterviewFindManyMock.mockResolvedValue([dbInterview()]);

      await listInterviewsForApplication("app-1", "user-1");

      expect(jobInterviewFindManyMock).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { roundNumber: "asc" } }),
      );
    });
  });

  describe("deleteJobInterview", () => {
    it("deletes only after verifying ownership through the parent application", async () => {
      jobInterviewFindUniqueMock.mockResolvedValue({
        ...dbInterview(),
        application: { userId: "user-1" },
      });

      await deleteJobInterview("interview-1", "user-1");

      expect(jobInterviewDeleteMock).toHaveBeenCalledWith({
        where: { id: "interview-1" },
      });
    });
  });
});
