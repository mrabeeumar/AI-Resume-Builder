import { beforeEach, describe, expect, it, vi } from "vitest";

const jobApplicationFindManyMock = vi.fn();
const jobInterviewFindManyMock = vi.fn();
const interviewSessionFindManyMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    jobApplication: {
      findMany: (...args: unknown[]) => jobApplicationFindManyMock(...args),
    },
    jobInterview: {
      findMany: (...args: unknown[]) => jobInterviewFindManyMock(...args),
    },
    interviewSession: {
      findMany: (...args: unknown[]) => interviewSessionFindManyMock(...args),
    },
  },
}));

const { getApplicationAnalyticsForUser } = await import(
  "@/services/job-application-analytics.service"
);

describe("job-application-analytics.service", () => {
  beforeEach(() => {
    jobApplicationFindManyMock.mockReset();
    jobInterviewFindManyMock.mockReset();
    interviewSessionFindManyMock.mockReset();
  });

  it("is a read-only aggregation across applications and interviews", async () => {
    jobApplicationFindManyMock.mockResolvedValue([
      {
        position: "Senior Engineer",
        status: "OFFER_RECEIVED",
        applicationDate: new Date("2026-01-15"),
        createdAt: new Date("2026-01-10"),
        parsedJobDescription: JSON.stringify({
          requiredSkills: { technical: ["React"], programmingLanguages: ["TypeScript"] },
          keywords: [{ keyword: "React", importance: 9 }],
        }),
      },
      {
        position: "Senior Engineer",
        status: "REJECTED",
        applicationDate: new Date("2026-02-01"),
        createdAt: new Date("2026-01-28"),
        parsedJobDescription: null,
      },
    ]);
    jobInterviewFindManyMock.mockResolvedValue([
      { status: "COMPLETED" },
      { status: "SCHEDULED" },
    ]);
    interviewSessionFindManyMock.mockResolvedValue([
      { overallScore: 80 },
      { overallScore: 60 },
    ]);

    const analytics = await getApplicationAnalyticsForUser("user-1");

    expect(analytics.applicationsSubmitted).toBe(2);
    expect(analytics.offers).toBe(1);
    expect(analytics.rejections).toBe(1);
    expect(analytics.acceptanceRate).toBe(100);
    expect(analytics.interviews).toBe(2);
    expect(analytics.interviewSuccessRate).toBe(50);
    expect(analytics.averageInterviewScore).toBe(70);
    expect(analytics.mostAppliedPositions[0]).toEqual({
      position: "Senior Engineer",
      count: 2,
    });
    expect(analytics.mostCommonSkillsRequested).toContainEqual(
      expect.objectContaining({ skill: "React" }),
    );
    expect(analytics.applicationsPerMonth).toHaveLength(12);

    expect(jobApplicationFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
  });

  it("skips malformed stored JSON instead of throwing", async () => {
    jobApplicationFindManyMock.mockResolvedValue([
      {
        position: "Engineer",
        status: "APPLIED",
        applicationDate: null,
        createdAt: new Date(),
        parsedJobDescription: "{ not valid json",
      },
    ]);
    jobInterviewFindManyMock.mockResolvedValue([]);
    interviewSessionFindManyMock.mockResolvedValue([]);

    const analytics = await getApplicationAnalyticsForUser("user-1");

    expect(analytics.mostCommonSkillsRequested).toEqual([]);
    expect(analytics.averageInterviewScore).toBeNull();
  });
});
