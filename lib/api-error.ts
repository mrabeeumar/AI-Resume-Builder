import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { logger, serializeError } from "@/lib/logger";

type StatusError = Error & { status: number };

function hasStatus(error: unknown): error is StatusError {
  return (
    error instanceof Error &&
    typeof (error as { status?: unknown }).status === "number"
  );
}

// Shared catch-block handler for API routes. Maps zod validation errors and
// any service-layer error carrying a `status` (ResumeServiceError,
// AIServiceError, RateLimitError, etc.) to the appropriate response, and logs
// truly unexpected errors server-side instead of swallowing them silently.
export function handleRouteError(error: unknown, route: string): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid input.", issues: error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  if (hasStatus(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  logger.error("api_error", { route, error: serializeError(error) });

  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
