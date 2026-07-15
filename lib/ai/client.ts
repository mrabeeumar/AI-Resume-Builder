import { AIProviderError } from "@/lib/ai/errors";
import { GeminiProvider } from "@/lib/ai/providers/gemini.provider";
import { GroqProvider } from "@/lib/ai/providers/groq.provider";
import { OllamaProvider } from "@/lib/ai/providers/ollama.provider";
import type { AIProvider } from "@/lib/ai/provider";

let cachedProvider: AIProvider | undefined;

// Single place that knows which AI provider is active. Swapping providers
// only requires changing this factory (or the AI_PROVIDER env var) — the
// rest of the app depends on the abstract AIProvider contract.
export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.AI_PROVIDER ?? "gemini";

  if (providerName === "ollama") {
    cachedProvider = new OllamaProvider();
    return cachedProvider;
  }

  if (providerName === "groq") {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new AIProviderError(
        "GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys.",
        false,
        500,
      );
    }
    cachedProvider = new GroqProvider(groqApiKey);
    return cachedProvider;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AIProviderError(
      "GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey.",
      false,
      500,
    );
  }

  cachedProvider = new GeminiProvider(apiKey);
  return cachedProvider;
}
