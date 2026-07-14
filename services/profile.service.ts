import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import {
  getAICallLimit,
  getSubscriptionForUser,
} from "@/services/subscription.service";

const AI_USAGE_WINDOW_DAYS = 30;

export interface ProfileSummary {
  name: string | null;
  email: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  aiUsage: {
    totalCalls: number;
    totalTokens: number;
    windowDays: number;
    /** Monthly AI-call allowance for the plan; `null` means unlimited. */
    limit: number | null;
  };
}

// Compact, read-only summary consumed by the account/profile menu in the
// navbar. Intentionally lighter than getDashboardData: only the identity,
// plan, and AI-usage totals needed to render the menu.
export async function getProfileSummary(
  userId: string,
): Promise<ProfileSummary> {
  const since = new Date(
    Date.now() - AI_USAGE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const [user, subscription, usage] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
    getSubscriptionForUser(userId),
    prisma.aIUsage.aggregate({
      where: { userId, createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { tokensUsed: true },
    }),
  ]);

  return {
    name: user?.name ?? null,
    email: user?.email ?? null,
    plan: subscription.plan,
    status: subscription.status,
    aiUsage: {
      totalCalls: usage._count._all,
      totalTokens: usage._sum.tokensUsed ?? 0,
      windowDays: AI_USAGE_WINDOW_DAYS,
      limit: getAICallLimit(subscription.plan),
    },
  };
}
