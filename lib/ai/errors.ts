// Central error types for the AI layer. `transient` marks errors that are
// safe to retry (network hiccups, rate limits, provider 5xx) as opposed to
// permanent failures (bad prompt, invalid API key, malformed schema).

export class AIProviderError extends Error {
  constructor(
    message: string,
    public transient: boolean = false,
    public status: number = 502,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

export class AIResponseValidationError extends Error {
  constructor(
    message: string,
    public raw: string,
  ) {
    super(message);
    this.name = "AIResponseValidationError";
  }
}
