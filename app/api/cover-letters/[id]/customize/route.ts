import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import { enforceRateLimit } from "@/lib/rate-limit";
import { customizeCoverLetter } from "@/services/cover-letter.service";

type RouteParams = { params: Promise<{ id: string }> };

const AI_RATE_LIMIT = 20;
const AI_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export const POST = withRequestLog(
  "POST /api/cover-letters/[id]/customize",
  async (request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      await enforceRateLimit(
        `cover-letters:customize:${session.user.id}`,
        AI_RATE_LIMIT,
        AI_RATE_LIMIT_WINDOW_SECONDS,
      );

      const body = await request.json();
      const coverLetter = await customizeCoverLetter(id, session.user.id, body);

      return NextResponse.json({ coverLetter });
    } catch (error) {
      return handleRouteError(error, "POST /api/cover-letters/[id]/customize");
    }
  },
);
