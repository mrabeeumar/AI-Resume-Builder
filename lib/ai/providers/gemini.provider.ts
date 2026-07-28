import { AIProviderError } from "@/lib/ai/errors";
import type {
  AICompletionRequest,
  AICompletionResult,
  AIProvider,
} from "@/lib/ai/provider";

const DEFAULT_MODEL = "gemini-2.0-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const DEFAULT_MAX_OUTPUT_TOKENS = 8192;

type GeminiResponse = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

// Free-tier Gemini provider (Google AI Studio). No billing account is
// required — only a free API key from https://aistudio.google.com/apikey.
export class GeminiProvider implements AIProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = process.env.GEMINI_MODEL ??
      DEFAULT_MODEL,
  ) {}

  async complete({
    system,
    prompt,
    temperature = 0.7,
  }: AICompletionRequest): Promise<AICompletionResult> {
    const url = `${API_BASE}/${this.model}:generateContent?key=${this.apiKey}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            // Every AI feature in this app expects a JSON object back.
            // Native JSON mode makes Gemini emit strictly valid JSON
            // instead of prose or markdown-fenced output, which is the
            // main source of intermittent schema-validation failures.
            responseMimeType: "application/json",
            // Bound output so long resumes/cover letters aren't truncated
            // mid-JSON (which surfaces as "unterminated JSON value").
            maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
          },
        }),
      });
    } catch {
      throw new AIProviderError(
        "Failed to reach the Gemini API.",
        true,
        503,
      );
    }

    if (!response.ok) {
      const isTransient = response.status === 429 || response.status >= 500;
      const body = await response.text().catch(() => "");
      throw new AIProviderError(
        `Gemini API request failed (${response.status}): ${body.slice(0, 300)}`,
        isTransient,
        response.status,
      );
    }

    let data: GeminiResponse;
    try {
      data = (await response.json()) as GeminiResponse;
    } catch {
      throw new AIProviderError(
        "Gemini API returned a malformed response.",
        true,
        502,
      );
    }

    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      const blockReason = data.promptFeedback?.blockReason;
      const finishReason = candidate?.finishReason;

      // A prompt/response blocked by safety filters won't succeed on retry,
      // so mark it non-transient. Truncation (MAX_TOKENS) and unexplained
      // empty responses are treated as retryable.
      if (blockReason) {
        throw new AIProviderError(
          `Gemini blocked the request (${blockReason}).`,
          false,
          502,
        );
      }
      if (finishReason && finishReason !== "STOP") {
        throw new AIProviderError(
          `Gemini returned no content (finishReason=${finishReason}).`,
          finishReason === "SAFETY" || finishReason === "RECITATION"
            ? false
            : true,
          502,
        );
      }
      throw new AIProviderError(
        "Gemini API returned an empty response.",
        true,
        502,
      );
    }

    const promptTokens = data.usageMetadata?.promptTokenCount ?? 0;
    const completionTokens = data.usageMetadata?.candidatesTokenCount ?? 0;
    const totalTokens =
      data.usageMetadata?.totalTokenCount ??
      promptTokens + completionTokens;

    return { text, promptTokens, completionTokens, totalTokens };
  }
}
