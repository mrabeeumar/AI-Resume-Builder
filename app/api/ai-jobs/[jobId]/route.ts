import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { getOwnedAiJob } from "@/services/ai-job.service";

import { withRequestLog } from "@/lib/api-log";
type RouteParams = { params: Promise<{ jobId: string }> };

export const GET = withRequestLog(
  "GET /api/ai-jobs/[jobId]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { jobId } = await params;

    try {
      const job = await getOwnedAiJob(jobId, session.user.id);

      return NextResponse.json({ job });
    } catch (error) {
      return handleRouteError(error, "GET /api/ai-jobs/[jobId]");
    }
  },
);
