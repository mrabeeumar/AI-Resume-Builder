import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import { enforceRateLimit } from "@/lib/rate-limit";
import { generateResumeContent } from "@/services/ai-resume.service";

type RouteParams = { params: Promise<{ id: string }> };

const AI_RATE_LIMIT = 30;
const AI_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export const POST = withRequestLog(
  "POST /api/resumes/[id]/generate",
  async (request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      await enforceRateLimit(
        `resumes:generate:${session.user.id}`,
        AI_RATE_LIMIT,
        AI_RATE_LIMIT_WINDOW_SECONDS,
      );

      const body = await request.json();
      const sections = await generateResumeContent(id, session.user.id, body);

      return NextResponse.json({ sections });
    } catch (error) {
      return handleRouteError(error, "POST /api/resumes/[id]/generate");
    }
  },
);
