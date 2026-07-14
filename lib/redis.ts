import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

// Redis is optional infrastructure (rate limiting, AI result caching). When
// REDIS_URL isn't configured, callers fail open instead of crashing — see
// lib/rate-limit.ts and services/ats.service.ts.
export const redis: Redis | null =
  globalForRedis.redis !== undefined
    ? globalForRedis.redis
    : process.env.REDIS_URL
      ? new Redis(process.env.REDIS_URL, {
          // Serverless functions are short-lived; fail fast instead of
          // letting ioredis retry indefinitely and hang the invocation.
          maxRetriesPerRequest: 1,
          connectTimeout: 5000,
        })
      : null;

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
