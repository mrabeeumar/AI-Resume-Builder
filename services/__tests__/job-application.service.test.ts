import { beforeEach, describe, expect, it, vi } from "vitest";

const getOwnedResumeOrThrowMock = vi.fn();
vi.mock("@/services/resume.service", () => ({
  getOwnedResumeOrThrow: (...args: unknown[]) => getOwnedResumeOrThrowMock(...args),
}));

const getVersionForResumeMock = vi.fn();
vi.mock("@/services/resume-version.service", () => ({
  getVersionForResume: (...args: unknown[]) => getVersionForResumeMock(...args),
}));

const getOwnedCoverLetterOrThrowMock = vi.fn();
vi.mock("@/services/cover-letter.service", () => ({
  getOwnedCoverLetterOrThrow: (...args: unknown[]) =>
    getOwnedCoverLetterOrThrowMock(...args),
}));

const getOwnedJobDescriptionOrThrowMock = vi.fn();
vi.mock("@/services/job-description.service", () => ({
  getOwnedJobDescriptionOrThrow: (...args: unknown[]) =>
    getOwnedJobDescriptionOrThrowMock(...args),
}));

const jobApplicationFindUniqueMock = vi.fn();
const jobApplicationFindManyMock = vi.fn();
const jobApplicationCountMock = vi.fn();
const jobApplicationCreateMock = vi.fn();
const jobApplicationUpdateMock = vi.fn();
const jobApplicationDeleteMock = vi.fn();
const applicationTimelineCreateMock = vi.fn();
const applicationTimelineFindManyMock = vi.fn();
const jobInterviewFindManyMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    jobApplication: {
      findUnique: (...args: unknown[]) => jobApplicationFindUniqueMock(...args),
      findMany: (...args: unknown[]) => jobApplicationFindManyMock(...args),
      count: (...args: unknown[]) => jobApplicationCountMock(...args),
      create: (...args: unknown[]) => jobApplicationCreateMock(...args),
      update: (...args: unknown[]) => jobApplicationUpdateMock(...args),
      delete: (...args: unknown[]) => jobApplicationDeleteMock(...args),
    },
    applicationTimeline: {
      create: (...args: unknown[]) => applicationTimelineCreateMock(...args),
      findMany: (...args: unknown[]) => applicationTimelineFindManyMock(...args),
    },
    jobInterview: {
      findMany: (...args: unknown[]) => jobInterviewFindManyMock(...args),
    },
  },
}));

const {
  createJobApplication,
  createJobApplicationFromTailoring,
  deleteJobApplication,
  getJobApplicationForUser,
  getOwnedJobApplicationOrThrow,
  JobApplicationServiceError,
  listJobApplicationsForUser,
  updateJobApplication,
  updateJobApplicationStatus,
} = await import("@/services/job-application.service");

function dbApplication(overrides: Record<string, unknown> = {}) {
  return {
    id: "app-1",
    userId: "user-1",
    company: "Acme",
    companyLogo: null,
    position: "Senior Engineer",
    location: "Remote",
    salary: null,
    employmentType: null,
    workMode: null,
    status: "SAVED",
    source: "MANUAL",
    applicationDate: null,
    deadline: null,
    originalJobUrl: null,
    parsedJobDescription: null,
    notes: null,
    resumeId: null,
    resumeVersionId: null,
    coverLetterId: null,
    jobDescriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("job-application.service", () => {
  beforeEach(() => {
    getOwnedResumeOrThrowMock.mockReset();
    getVersionForResumeMock.mockReset();
    getOwnedCoverLetterOrThrowMock.mockReset();
    getOwnedJobDescriptionOrThrowMock.mockReset();
    jobApplicationFindUniqueMock.mockReset();
    jobApplicationFindManyMock.mockReset();
    jobApplicationCountMock.mockReset();
    jobApplicationCreateMock.mockReset();
    jobApplicationUpdateMock.mockReset();
    jobApplicationDeleteMock.mockReset();
    applicationTimelineCreateMock.mockReset();
    applicationTimelineFindManyMock.mockReset();
    jobInterviewFindManyMock.mockReset();
  });

  describe("getOwnedJobApplicationOrThrow", () => {
    it("throws a 404 when the application does not belong to the user", async () => {
      jobApplicationFindUniqueMock.mockResolvedValue(
        dbApplication({ userId: "someone-else" }),
      );

      await expect(
        getOwnedJobApplicationOrThrow("app-1", "user-1"),
      ).rejects.toMatchObject({ status: 404 });
    });

    it("throws a 404 when the application does not exist", async () => {
      jobApplicationFindUniqueMock.mockResolvedValue(null);

      await expect(
        getOwnedJobApplicationOrThrow("app-1", "user-1"),
      ).rejects.toThrow(JobApplicationServiceError);
    });

    it("returns the application when owned by the user", async () => {
      const application = dbApplication();
      jobApplicationFindUniqueMock.mockResolvedValue(application);

      await expect(
        getOwnedJobApplicationOrThrow("app-1", "user-1"),
      ).resolves.toEqual(application);
    });
  });

  describe("createJobApplication", () => {
    it("creates a manual application and records a timeline event", async () => {
      jobApplicationCreateMock.mockResolvedValue(dbApplication());

      const result = await createJobApplication(
        { company: "Acme", position: "Senior Engineer" },
        "user-1",
      );

      expect(jobApplicationCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            company: "Acme",
            position: "Senior Engineer",
            source: "MANUAL",
          }),
        }),
      );
      expect(applicationTimelineCreateMock).toHaveBeenCalledOnce();
      expect(result.id).toBe("app-1");
    });

    it("validates ownership of a linked resume before creating", async () => {
      getOwnedResumeOrThrowMock.mockRejectedValue(
        new JobApplicationServiceError("Resume not found.", 404),
      );

      await expect(
        createJobApplication(
          { company: "Acme", position: "Engineer", resumeId: "resume-1" },
          "user-1",
        ),
      ).rejects.toMatchObject({ status: 404 });
      expect(jobApplicationCreateMock).not.toHaveBeenCalled();
    });

    it("rejects invalid input", async () => {
      await expect(
        createJobApplication({ company: "", position: "" }, "user-1"),
      ).rejects.toThrow();
    });
  });

  describe("createJobApplicationFromTailoring", () => {
    it("inherits the resume version and job description without duplication", async () => {
      jobApplicationCreateMock.mockResolvedValue(
        dbApplication({ source: "TAILORING", resumeId: "resume-1", resumeVersionId: "v1" }),
      );

      const result = await createJobApplicationFromTailoring(
        {
          resumeId: "resume-1",
          resumeVersionId: "v1",
          jobDescriptionId: "jd-1",
          company: "Acme",
          position: "Senior Engineer",
        },
        "user-1",
      );

      expect(getOwnedResumeOrThrowMock).toHaveBeenCalledWith("resume-1", "user-1");
      expect(getVersionForResumeMock).toHaveBeenCalledWith("resume-1", "v1", "user-1");
      expect(getOwnedJobDescriptionOrThrowMock).toHaveBeenCalledWith("jd-1", "user-1");
      expect(jobApplicationCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ source: "TAILORING" }),
        }),
      );
      expect(result.source).toBe("TAILORING");
    });
  });

  describe("updateJobApplicationStatus", () => {
    it("updates status and records the correct timeline event", async () => {
      jobApplicationFindUniqueMock.mockResolvedValue(dbApplication());
      jobApplicationUpdateMock.mockResolvedValue(
        dbApplication({ status: "OFFER_RECEIVED" }),
      );

      const result = await updateJobApplicationStatus(
        "app-1",
        { status: "OFFER_RECEIVED" },
        "user-1",
      );

      expect(result.status).toBe("OFFER_RECEIVED");
      expect(applicationTimelineCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ event: "OFFER_RECEIVED" }),
        }),
      );
    });

    it("rejects an arbitrary, non-predefined status value", async () => {
      jobApplicationFindUniqueMock.mockResolvedValue(dbApplication());

      await expect(
        updateJobApplicationStatus(
          "app-1",
          { status: "NOT_A_REAL_STATUS" as never },
          "user-1",
        ),
      ).rejects.toThrow();
    });

    it("throws when the application is not owned by the user", async () => {
      jobApplicationFindUniqueMock.mockResolvedValue(
        dbApplication({ userId: "someone-else" }),
      );

      await expect(
        updateJobApplicationStatus("app-1", { status: "APPLIED" }, "user-1"),
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  describe("updateJobApplication", () => {
    it("records a NOTE_ADDED timeline event when notes change", async () => {
      jobApplicationFindUniqueMock.mockResolvedValue(dbApplication());
      jobApplicationUpdateMock.mockResolvedValue(
        dbApplication({ notes: "Ping recruiter Friday" }),
      );

      await updateJobApplication(
        "app-1",
        { notes: "Ping recruiter Friday" },
        "user-1",
      );

      expect(applicationTimelineCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ event: "NOTE_ADDED" }),
        }),
      );
    });

    it("rejects an empty update payload", async () => {
      jobApplicationFindUniqueMock.mockResolvedValue(dbApplication());

      await expect(updateJobApplication("app-1", {}, "user-1")).rejects.toThrow();
    });
  });

  describe("deleteJobApplication", () => {
    it("deletes only after verifying ownership", async () => {
      jobApplicationFindUniqueMock.mockResolvedValue(dbApplication());

      await deleteJobApplication("app-1", "user-1");

      expect(jobApplicationDeleteMock).toHaveBeenCalledWith({
        where: { id: "app-1" },
      });
    });

    it("throws instead of deleting when not owned", async () => {
      jobApplicationFindUniqueMock.mockResolvedValue(
        dbApplication({ userId: "someone-else" }),
      );

      await expect(deleteJobApplication("app-1", "user-1")).rejects.toMatchObject({
        status: 404,
      });
      expect(jobApplicationDeleteMock).not.toHaveBeenCalled();
    });
  });

  describe("listJobApplicationsForUser", () => {
    it("applies search, status, and pagination filters", async () => {
      jobApplicationFindManyMock.mockResolvedValue([dbApplication()]);
      jobApplicationCountMock.mockResolvedValue(1);

      const result = await listJobApplicationsForUser("user-1", {
        search: "Acme",
        status: "SAVED",
        page: 2,
        limit: 10,
      });

      expect(jobApplicationFindManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: "user-1", status: "SAVED" }),
          skip: 10,
          take: 10,
        }),
      );
      expect(result.pagination).toEqual({ page: 2, limit: 10, total: 1, pages: 1 });
    });
  });

  describe("getJobApplicationForUser", () => {
    it("returns 404 for another user's application", async () => {
      jobApplicationFindUniqueMock.mockResolvedValue(
        dbApplication({ userId: "someone-else" }),
      );

      await expect(getJobApplicationForUser("app-1", "user-1")).rejects.toMatchObject({
        status: 404,
      });
    });
  });
});
