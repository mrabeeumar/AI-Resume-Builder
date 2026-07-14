import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const aggregateMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUniqueMock(...args) },
    aIUsage: { aggregate: (...args: unknown[]) => aggregateMock(...args) },
  },
}));

const getSubscriptionForUserMock = vi.fn();
vi.mock("@/services/subscription.service", async () => {
  const actual = await vi.importActual<
    typeof import("@/services/subscription.service")
  >("@/services/subscription.service");
  return {
    ...actual,
    getSubscriptionForUser: (...args: unknown[]) =>
      getSubscriptionForUserMock(...args),
  };
});

const { getProfileSummary } = await import("@/services/profile.service");

describe("getProfileSummary", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    aggregateMock.mockReset();
    getSubscriptionForUserMock.mockReset();
  });

  it("returns identity, plan, and usage with the FREE-plan limit", async () => {
    findUniqueMock.mockResolvedValue({
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
    getSubscriptionForUserMock.mockResolvedValue({
      plan: "FREE",
      status: "ACTIVE",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    aggregateMock.mockResolvedValue({
      _count: { _all: 7 },
      _sum: { tokensUsed: 1234 },
    });

    const summary = await getProfileSummary("user-1");

    expect(summary).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      plan: "FREE",
      status: "ACTIVE",
      aiUsage: {
        totalCalls: 7,
        totalTokens: 1234,
        windowDays: 30,
        limit: 20,
      },
    });
  });

  it("reports an unlimited AI-call limit for paid plans", async () => {
    findUniqueMock.mockResolvedValue({ name: null, email: "pro@example.com" });
    getSubscriptionForUserMock.mockResolvedValue({
      plan: "PRO",
      status: "ACTIVE",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    aggregateMock.mockResolvedValue({
      _count: { _all: 0 },
      _sum: { tokensUsed: null },
    });

    const summary = await getProfileSummary("user-2");

    expect(summary.aiUsage.limit).toBeNull();
    expect(summary.aiUsage.totalCalls).toBe(0);
    expect(summary.aiUsage.totalTokens).toBe(0);
    expect(summary.name).toBeNull();
  });

  it("falls back to null identity when the user is missing", async () => {
    findUniqueMock.mockResolvedValue(null);
    getSubscriptionForUserMock.mockResolvedValue({
      plan: "FREE",
      status: "ACTIVE",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    aggregateMock.mockResolvedValue({
      _count: { _all: 0 },
      _sum: { tokensUsed: null },
    });

    const summary = await getProfileSummary("ghost");

    expect(summary.name).toBeNull();
    expect(summary.email).toBeNull();
  });
});
