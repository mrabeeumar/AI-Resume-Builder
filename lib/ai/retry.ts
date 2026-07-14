import { AIProviderError } from "@/lib/ai/errors";

export type RetryOptions = {
  attempts?: number;
  baseDelayMs?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retries only transient failures (network errors, rate limits, provider
// 5xx) with exponential backoff. Non-transient errors (bad input, invalid
// schema) fail immediately.
export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, baseDelayMs = 500 }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isTransient =
        error instanceof AIProviderError ? error.transient : false;

      if (!isTransient || attempt === attempts) {
        throw error;
      }

      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}
