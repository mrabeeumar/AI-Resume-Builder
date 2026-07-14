import { NextResponse } from "next/server";
import { after } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  createAiJob,
  markAiJobCompleted,
  markAiJobFailed,
  markAiJobProcessing,
} from "@/services/ai-job.service";
import { analyzeAts } from "@/services/ats.service";

type RouteParams = { params: Promise<{ id: string }> };

const AI_JOB_RATE_LIMIT = 15;
const AI_JOB_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export const POST = withRequestLog(
  "POST /api/resumes/[id]/ats-analysis",
  async (request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    try {
      await enforceRateLimit(
        `resumes:ats-analysis:${userId}`,
        AI_JOB_RATE_LIMIT,
        AI_JOB_RATE_LIMIT_WINDOW_SECONDS,
      );

      const body = await request.json().catch(() => ({}));
      const job = await createAiJob(id, userId, "ATS_ANALYSIS", body);

      after(async () => {
        try {
          await markAiJobProcessing(job.id);
          const result = await analyzeAts(id, userId, body);
          await markAiJobCompleted(job.id, result);
        } catch (error) {
          await markAiJobFailed(
            job.id,
            error instanceof Error ? error.message : "Something went wrong.",
          );
        }
      });

      return NextResponse.json({ jobId: job.id }, { status: 202 });
    } catch (error) {
      return handleRouteError(error, "POST /api/resumes/[id]/ats-analysis");
    }
  },
);
