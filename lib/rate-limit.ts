import { redis } from "@/lib/redis";

// Thrown when a caller exceeds an allotted quota. Carries a `status` so it is
// picked up automatically by the shared API error handler (lib/api-error.ts).
export class RateLimitError extends Error {
  constructor(
    message = "Too many requests. Please try again later.",
    public status: number = 429,
    public retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

// Fixed-window counter backed by Redis. Throws RateLimitError once `limit`
// calls have been made for `key` within `windowSeconds`.
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  if (!redis) return;

  const redisKey = `ratelimit:${key}`;
  const count = await redis.incr(redisKey);

  if (count === 1) {
    await redis.expire(redisKey, windowSeconds);
  }

  if (count > limit) {
    const ttl = await redis.ttl(redisKey);
    throw new RateLimitError(
      "Too many requests. Please try again later.",
      429,
      ttl > 0 ? ttl : windowSeconds,
    );
  }
}
