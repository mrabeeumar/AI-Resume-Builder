import type { ZodType } from "zod";

import { getAIProvider } from "@/lib/ai/client";
import { AIProviderError, AIResponseValidationError } from "@/lib/ai/errors";
import { parseAndValidateJSON } from "@/lib/ai/json-parser";
import { withRetry } from "@/lib/ai/retry";
import type { AIFeature } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { assertWithinAIUsageLimit } from "@/services/subscription.service";

const AI_RATE_LIMIT = 30;
const AI_RATE_LIMIT_WINDOW_SECONDS = 10 * 60;

export class AIServiceError extends Error {
  constructor(
    message: string,
    public status: number = 502,
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

export type GenerateJSONParams<T> = {
  feature: AIFeature;
  userId: string;
  system: string;
  prompt: string;
  schema: ZodType<T>;
  temperature?: number;
};

async function recordUsage(
  userId: string,
  feature: AIFeature,
  tokensUsed: number,
) {
  await prisma.aIUsage.create({
    data: { userId, feature, tokensUsed },
  });
}

// Central entry point for all AI features. Handles provider invocation,
// retrying transient failures, extracting/validating JSON output, and
// recording token usage. Feature-specific prompts and business logic live in
// their own services (resume generation, ATS analysis, cover letters) and
// call through here rather than talking to the provider directly.
export async function generateAIJSON<T>({
  feature,
  userId,
  system,
  prompt,
  schema,
  temperature,
}: GenerateJSONParams<T>): Promise<T> {
  await enforceRateLimit(
    `ai:${userId}`,
    AI_RATE_LIMIT,
    AI_RATE_LIMIT_WINDOW_SECONDS,
  );
  await assertWithinAIUsageLimit(userId);

  const provider = getAIProvider();

  let result;
  try {
    result = await withRetry(() =>
      provider.complete({ system, prompt, temperature }),
    );
  } catch (error) {
    if (error instanceof AIProviderError) {
      // Log the raw provider detail server-side only — it may contain
      // upstream quota/error text that shouldn't be echoed to the client.
      console.error(`[ai] provider error (feature=${feature})`, error.message);
      throw new AIServiceError(
        error.status === 429
          ? "The AI service is rate-limited right now. Please try again shortly."
          : "The AI service is temporarily unavailable. Please try again.",
        error.status,
      );
    }
    throw error;
  }

  await recordUsage(userId, feature, result.totalTokens);

  try {
    return parseAndValidateJSON(result.text, schema);
  } catch (error) {
    if (error instanceof AIResponseValidationError) {
      throw new AIServiceError(error.message, 502);
    }
    throw error;
  }
}
