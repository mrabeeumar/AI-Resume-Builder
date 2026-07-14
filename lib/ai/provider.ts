export type AICompletionRequest = {
  system: string;
  prompt: string;
  temperature?: number;
};

export type AICompletionResult = {
  text: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

// Abstract provider contract. Keeps the rest of the AI layer (retry, JSON
// parsing, usage tracking) independent of which model/vendor is behind it.
export interface AIProvider {
  complete(request: AICompletionRequest): Promise<AICompletionResult>;
}
