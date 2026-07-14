import { prisma } from "@/lib/prisma";
import { TERMINAL_STATUSES } from "@/services/job-application.service";
import type { JobApplicationAnalytics } from "@/types/job-application";
import type { ParsedJobDescription } from "@/types/job-parser.schema";

const TOP_SKILLS_LIMIT = 10;
const TOP_POSITIONS_LIMIT = 10;
const APPLICATIONS_PER_MONTH_WINDOW = 12;

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Read-only aggregation across a user's applications and interviews (see
// roadmap M21 "Analytics"). Average interview score is sourced from M20's
// InterviewSession records — this module never runs interview logic itself,
// only reads its results.
export async function getApplicationAnalyticsForUser(
  userId: string,
): Promise<JobApplicationAnalytics> {
  const [applications, interviews, completedInterviewSessions] =
    await Promise.all([
      prisma.jobApplication.findMany({
        where: { userId },
        select: {
          position: true,
          status: true,
          applicationDate: true,
          createdAt: true,
          parsedJobDescription: true,
        },
      }),
      prisma.jobInterview.findMany({
        where: { application: { userId } },
        select: { status: true },
      }),
      prisma.interviewSession.findMany({
        where: { userId, status: "COMPLETED", overallScore: { not: null } },
        select: { overallScore: true },
      }),
    ]);

  const applicationsSubmitted = applications.filter(
    (application) => application.status !== "SAVED",
  ).length;
  const offers = applications.filter(
    (application) => application.status === "OFFER_RECEIVED" || application.status === "ACCEPTED",
  ).length;
  const rejections = applications.filter(
    (application) => application.status === "REJECTED",
  ).length;
  const acceptedOrRejected = applications.filter((application) =>
    (TERMINAL_STATUSES as string[]).includes(application.status),
  ).length;

  const completedInterviews = interviews.filter(
    (interview) => interview.status === "COMPLETED",
  ).length;

  const skillCounts = new Map<string, number>();
  const positionCounts = new Map<string, number>();
  const monthCounts = new Map<string, number>();

  for (const application of applications) {
    positionCounts.set(
      application.position,
      (positionCounts.get(application.position) ?? 0) + 1,
    );

    const monthSource = application.applicationDate ?? application.createdAt;
    const key = monthKey(monthSource);
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);

    if (!application.parsedJobDescription) continue;
    try {
      const parsed = JSON.parse(
        application.parsedJobDescription,
      ) as ParsedJobDescription;
      const skills = [
        ...parsed.requiredSkills.technical,
        ...parsed.requiredSkills.programmingLanguages,
        ...parsed.keywords.map((keyword) => keyword.keyword),
      ];
      for (const skill of skills) {
        const key = skill.trim();
        if (!key) continue;
        skillCounts.set(key, (skillCounts.get(key) ?? 0) + 1);
      }
    } catch {
      // Malformed/legacy stored JSON is skipped rather than failing the
      // whole analytics read.
    }
  }

  const now = new Date();
  const applicationsPerMonth = Array.from({
    length: APPLICATIONS_PER_MONTH_WINDOW,
  })
    .map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      const key = monthKey(date);
      return { month: key, count: monthCounts.get(key) ?? 0 };
    })
    .reverse();

  const averageInterviewScore = completedInterviewSessions.length
    ? Math.round(
        completedInterviewSessions.reduce(
          (sum, session) => sum + (session.overallScore ?? 0),
          0,
        ) / completedInterviewSessions.length,
      )
    : null;

  return {
    applicationsSubmitted,
    interviews: interviews.length,
    offers,
    rejections,
    acceptanceRate: acceptedOrRejected
      ? Math.round((offers / acceptedOrRejected) * 100)
      : 0,
    interviewSuccessRate: interviews.length
      ? Math.round((completedInterviews / interviews.length) * 100)
      : 0,
    averageInterviewScore,
    mostCommonSkillsRequested: Array.from(skillCounts.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_SKILLS_LIMIT),
    mostAppliedPositions: Array.from(positionCounts.entries())
      .map(([position, count]) => ({ position, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_POSITIONS_LIMIT),
    applicationsPerMonth,
  };
}
