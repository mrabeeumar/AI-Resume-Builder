import { prisma } from "@/lib/prisma";

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

// Fixed-window counter backed by the database. Throws RateLimitError once
// `limit` calls have been made for `key` within `windowSeconds`. Uses a
// raw MERGE so the increment-or-reset is atomic under concurrent requests.
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const now = new Date();
  const windowExpiry = new Date(now.getTime() + windowSeconds * 1000);

  const rows = await prisma.$queryRaw<{ count: number; expiresAt: Date }[]>`
    MERGE rate_limit_counters AS target
    USING (SELECT ${key} AS [key]) AS source
    ON target.[key] = source.[key]
    WHEN MATCHED AND target.[expiresAt] > ${now}
      THEN UPDATE SET [count] = target.[count] + 1
    WHEN MATCHED
      THEN UPDATE SET [count] = 1, [expiresAt] = ${windowExpiry}
    WHEN NOT MATCHED
      THEN INSERT ([key], [count], [expiresAt])
      VALUES (${key}, 1, ${windowExpiry})
    OUTPUT inserted.[count] AS count, inserted.[expiresAt] AS expiresAt;
  `;

  const { count, expiresAt } = rows[0];

  if (count > limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((expiresAt.getTime() - now.getTime()) / 1000),
    );
    throw new RateLimitError(
      "Too many requests. Please try again later.",
      429,
      retryAfterSeconds,
    );
  }
}
