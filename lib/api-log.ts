import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { logger } from "@/lib/logger";

type RouteHandler<Args extends unknown[]> = (
  ...args: Args
) => Promise<NextResponse | Response>;

// Wraps an API route handler to log every request (route, user, status,
// duration) exactly once, regardless of whether it succeeds or fails.
// Handlers keep their own try/catch + handleRouteError for domain-specific
// error mapping; this only adds the outer observability layer.
export function withRequestLog<Args extends unknown[]>(
  route: string,
  handler: RouteHandler<Args>,
): RouteHandler<Args> {
  return async (...args: Args) => {
    const start = Date.now();
    let userId: string | undefined;

    try {
      const session = await auth();
      userId = session?.user?.id;
    } catch {
      // Session lookup failing must never block the request; it just means
      // this log line won't have a userId.
    }

    let response: NextResponse | Response;

    try {
      response = await handler(...args);
    } catch (error) {
      response = handleRouteError(error, route);
    }

    logger.info("api_request", {
      route,
      userId,
      status: response.status,
      durationMs: Date.now() - start,
    });

    return response;
  };
}
