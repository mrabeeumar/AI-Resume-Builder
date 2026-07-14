import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Runs `attempt` (a "read the last sequence value, then insert value+1"
// operation) and retries it if two concurrent callers raced for the same
// sequence value. Relies on a unique constraint covering the sequence
// column (e.g. @@unique([resumeId, versionNumber])) to turn the race into a
// Prisma P2002 error instead of a silent duplicate/overwrite, so the loser
// simply re-reads the new last value and tries again.
export async function createWithSequenceRetry<T>(
  attempt: () => Promise<T>,
  maxAttempts = 5,
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await attempt();
    } catch (error) {
      const isSequenceConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";

      if (!isSequenceConflict || i === maxAttempts - 1) {
        throw error;
      }
    }
  }

  throw new Error("Unreachable: createWithSequenceRetry exhausted attempts without returning or throwing.");
}
