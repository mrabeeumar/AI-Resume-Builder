import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const loggerErrorMock = vi.fn();
vi.mock("@/lib/logger", () => ({
  logger: { error: (...args: unknown[]) => loggerErrorMock(...args) },
  serializeError: (error: unknown) =>
    error instanceof Error ? { message: error.message } : { value: String(error) },
}));

const { handleRouteError } = await import("@/lib/api-error");

describe("handleRouteError", () => {
  beforeEach(() => {
    loggerErrorMock.mockClear();
  });

  it("maps ZodError to a 422 with field errors", async () => {
    const schema = z.object({ email: z.string().email() });
    const result = schema.safeParse({ email: "not-an-email" });
    if (result.success) throw new Error("expected validation to fail");

    const response = handleRouteError(result.error, "POST /api/test");

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toBe("Invalid input.");
    expect(body.issues.email).toBeDefined();
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it("maps errors carrying a status to that status code without logging", async () => {
    class RateLimitError extends Error {
      status = 429;
    }
    const response = handleRouteError(
      new RateLimitError("Too many requests."),
      "POST /api/test",
    );

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe("Too many requests.");
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it("logs and returns a generic 500 for unexpected errors", async () => {
    const response = handleRouteError(new Error("db exploded"), "GET /api/test");

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Something went wrong. Please try again.");
    expect(loggerErrorMock).toHaveBeenCalledWith(
      "api_error",
      expect.objectContaining({ route: "GET /api/test" }),
    );
  });
});
