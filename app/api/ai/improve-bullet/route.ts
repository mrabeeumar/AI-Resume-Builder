import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import { enforceRateLimit } from "@/lib/rate-limit";
import { improveBullet } from "@/services/ai-resume.service";

const AI_RATE_LIMIT = 30;
const AI_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export const POST = withRequestLog(
  "POST /api/ai/improve-bullet",
  async (request: Request) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
      await enforceRateLimit(
        `ai:improve-bullet:${session.user.id}`,
        AI_RATE_LIMIT,
        AI_RATE_LIMIT_WINDOW_SECONDS,
      );

      const body = await request.json();
      const result = await improveBullet(session.user.id, body);

      return NextResponse.json(result);
    } catch (error) {
      return handleRouteError(error, "POST /api/ai/improve-bullet");
    }
  },
);
