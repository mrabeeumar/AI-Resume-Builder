import { AIProviderError } from "@/lib/ai/errors";
import type {
  AICompletionRequest,
  AICompletionResult,
  AIProvider,
} from "@/lib/ai/provider";

const DEFAULT_MODEL = "qwen3.5:9b";
const DEFAULT_BASE_URL = "http://localhost:11434";

type OllamaChatResponse = {
  message?: { content?: string };
  prompt_eval_count?: number;
  eval_count?: number;
  error?: string;
};

// Fully local, free, no API key provider backed by a locally running Ollama
// server (https://ollama.com). Requires Ollama installed and the model
// pulled (`ollama pull <model>`) before use.
export class OllamaProvider implements AIProvider {
  constructor(
    private readonly model: string = process.env.OLLAMA_MODEL ??
      DEFAULT_MODEL,
    private readonly baseUrl: string = process.env.OLLAMA_BASE_URL ??
      DEFAULT_BASE_URL,
  ) {}

  async complete({
    system,
    prompt,
    temperature = 0.7,
  }: AICompletionRequest): Promise<AICompletionResult> {
    const url = `${this.baseUrl}/api/chat`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          think: false,
          // Every AI feature expects JSON back; Ollama's format flag
          // constrains decoding to valid JSON, matching the Gemini path.
          format: "json",
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          options: { temperature },
        }),
      });
    } catch {
      throw new AIProviderError(
        "Failed to reach the local Ollama server. Is `ollama serve` running?",
        true,
        503,
      );
    }

    if (!response.ok) {
      const isTransient = response.status === 429 || response.status >= 500;
      const body = await response.text().catch(() => "");
      throw new AIProviderError(
        `Ollama request failed (${response.status}): ${body.slice(0, 300)}`,
        isTransient,
        response.status,
      );
    }

    const data = (await response.json()) as OllamaChatResponse;
    const text = data.message?.content;

    if (!text) {
      throw new AIProviderError(
        data.error
          ? `Ollama returned an error: ${data.error}`
          : "Ollama returned an empty response.",
        true,
        502,
      );
    }

    const promptTokens = data.prompt_eval_count ?? 0;
    const completionTokens = data.eval_count ?? 0;

    return {
      text,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    };
  }
}
