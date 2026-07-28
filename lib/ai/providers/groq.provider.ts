import { AIProviderError } from "@/lib/ai/errors";
import type {
  AICompletionRequest,
  AICompletionResult,
  AIProvider,
} from "@/lib/ai/provider";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

type GroqResponse = {
  choices?: {
    message?: { content?: string };
    finish_reason?: string;
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
};

// Groq's OpenAI-compatible chat-completions API. Free tier, very low
// latency (LPU-hosted open models) — used as a fast alternative to local
// Ollama or Gemini's free-tier rate limits.
export class GroqProvider implements AIProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = process.env.GROQ_MODEL ?? DEFAULT_MODEL,
  ) {}

  async complete({
    system,
    prompt,
    temperature = 0.7,
  }: AICompletionRequest): Promise<AICompletionResult> {
    let response: Response;
    try {
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature,
          // Every AI feature expects a JSON object back; Groq's
          // OpenAI-compatible json_object mode enforces that, matching the
          // Gemini/Ollama providers.
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
        }),
      });
    } catch {
      throw new AIProviderError("Failed to reach the Groq API.", true, 503);
    }

    if (!response.ok) {
      const isTransient = response.status === 429 || response.status >= 500;
      const body = await response.text().catch(() => "");
      throw new AIProviderError(
        `Groq API request failed (${response.status}): ${body.slice(0, 300)}`,
        isTransient,
        response.status,
      );
    }

    let data: GroqResponse;
    try {
      data = (await response.json()) as GroqResponse;
    } catch {
      throw new AIProviderError(
        "Groq API returned a malformed response.",
        true,
        502,
      );
    }

    const choice = data.choices?.[0];
    const text = choice?.message?.content;

    if (!text) {
      const finishReason = choice?.finish_reason;
      throw new AIProviderError(
        data.error?.message
          ? `Groq returned an error: ${data.error.message}`
          : finishReason
            ? `Groq returned no content (finish_reason=${finishReason}).`
            : "Groq API returned an empty response.",
        true,
        502,
      );
    }

    const promptTokens = data.usage?.prompt_tokens ?? 0;
    const completionTokens = data.usage?.completion_tokens ?? 0;
    const totalTokens = data.usage?.total_tokens ?? promptTokens + completionTokens;

    return { text, promptTokens, completionTokens, totalTokens };
  }
}
