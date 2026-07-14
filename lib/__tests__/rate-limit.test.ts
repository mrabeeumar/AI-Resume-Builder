import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRawMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { $queryRaw: (...args: unknown[]) => queryRawMock(...args) },
}));

const { enforceRateLimit, RateLimitError } = await import("@/lib/rate-limit");

describe("enforceRateLimit", () => {
  beforeEach(() => {
    queryRawMock.mockReset();
  });

  it("allows the request when the counter is under the limit", async () => {
    queryRawMock.mockResolvedValue([
      { count: 3, expiresAt: new Date(Date.now() + 60_000) },
    ]);

    await expect(enforceRateLimit("key", 10, 60)).resolves.toBeUndefined();
  });

  it("throws RateLimitError with a 429 status once the limit is exceeded", async () => {
    const expiresAt = new Date(Date.now() + 30_000);
    queryRawMock.mockResolvedValue([{ count: 11, expiresAt }]);

    await expect(enforceRateLimit("key", 10, 60)).rejects.toMatchObject({
      status: 429,
      name: "RateLimitError",
    });
  });

  it("computes retryAfterSeconds from the counter's expiry", async () => {
    const expiresAt = new Date(Date.now() + 45_000);
    queryRawMock.mockResolvedValue([{ count: 11, expiresAt }]);

    try {
      await enforceRateLimit("key", 10, 60);
      throw new Error("expected enforceRateLimit to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      const rateLimitError = error as InstanceType<typeof RateLimitError>;
      expect(rateLimitError.retryAfterSeconds).toBeGreaterThan(0);
      expect(rateLimitError.retryAfterSeconds).toBeLessThanOrEqual(45);
    }
  });

  it("never allows a retryAfterSeconds below 1 even if the window just expired", async () => {
    const expiresAt = new Date(Date.now() - 1);
    queryRawMock.mockResolvedValue([{ count: 11, expiresAt }]);

    try {
      await enforceRateLimit("key", 10, 60);
      throw new Error("expected enforceRateLimit to throw");
    } catch (error) {
      const rateLimitError = error as InstanceType<typeof RateLimitError>;
      expect(rateLimitError.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    }
  });
});
