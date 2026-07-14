import { prisma } from "@/lib/prisma";
import { getSubscriptionForUser } from "@/services/subscription.service";

const RECENT_RESUMES_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 8;
const AI_USAGE_WINDOW_DAYS = 30;

export interface DashboardActivityItem {
  id: string;
  type:
    | "RESUME_CREATED"
    | "RESUME_UPDATED"
    | "COVER_LETTER_CREATED"
    | "COVER_LETTER_UPDATED";
  title: string;
  occurredAt: Date;
}

export interface DashboardData {
  resumeCount: number;
  coverLetterCount: number;
  recentResumes: {
    id: string;
    title: string;
    status: string;
    updatedAt: Date;
  }[];
  aiUsage: {
    totalCalls: number;
    totalTokens: number;
    windowDays: number;
    byFeature: { feature: string; calls: number; tokens: number }[];
  };
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  };
  activity: DashboardActivityItem[];
}

// Aggregates the read-only data needed by the dashboard from existing
// tables. There is no dedicated activity/audit-log model, so the activity
// feed is derived from Resume/CoverLetter created/updated timestamps rather
// than introducing a new table.
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const since = new Date(
    Date.now() - AI_USAGE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const [
    resumeCount,
    coverLetterCount,
    recentResumes,
    aiUsageByFeature,
    subscription,
    recentResumesForActivity,
    recentCoverLettersForActivity,
  ] = await Promise.all([
    prisma.resume.count({ where: { userId } }),
    prisma.coverLetter.count({ where: { userId } }),
    prisma.resume.findMany({
      where: { userId },
      select: { id: true, title: true, status: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: RECENT_RESUMES_LIMIT,
    }),
    prisma.aIUsage.groupBy({
      by: ["feature"],
      where: { userId, createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { tokensUsed: true },
    }),
    getSubscriptionForUser(userId),
    prisma.resume.findMany({
      where: { userId },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: RECENT_ACTIVITY_LIMIT,
    }),
    prisma.coverLetter.findMany({
      where: { userId },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: RECENT_ACTIVITY_LIMIT,
    }),
  ]);

  const byFeature = aiUsageByFeature
    .map((row) => ({
      feature: row.feature,
      calls: row._count._all,
      tokens: row._sum.tokensUsed ?? 0,
    }))
    .sort((a, b) => b.calls - a.calls);

  const activity: DashboardActivityItem[] = [
    ...recentResumesForActivity.map((resume) => ({
      id: resume.id,
      type: (resume.createdAt.getTime() === resume.updatedAt.getTime()
        ? "RESUME_CREATED"
        : "RESUME_UPDATED") as DashboardActivityItem["type"],
      title: resume.title,
      occurredAt: resume.updatedAt,
    })),
    ...recentCoverLettersForActivity.map((coverLetter) => ({
      id: coverLetter.id,
      type: (coverLetter.createdAt.getTime() === coverLetter.updatedAt.getTime()
        ? "COVER_LETTER_CREATED"
        : "COVER_LETTER_UPDATED") as DashboardActivityItem["type"],
      title: coverLetter.title,
      occurredAt: coverLetter.updatedAt,
    })),
  ]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT);

  return {
    resumeCount,
    coverLetterCount,
    recentResumes,
    aiUsage: {
      totalCalls: byFeature.reduce((sum, row) => sum + row.calls, 0),
      totalTokens: byFeature.reduce((sum, row) => sum + row.tokens, 0),
      windowDays: AI_USAGE_WINDOW_DAYS,
      byFeature,
    },
    subscription,
    activity,
  };
}
