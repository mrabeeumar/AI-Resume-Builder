import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { listApplicationTimeline } from "@/services/job-application.service";

import { withRequestLog } from "@/lib/api-log";
type RouteParams = { params: Promise<{ id: string }> };

export const GET = withRequestLog(
  "GET /api/applications/[id]/timeline",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const timeline = await listApplicationTimeline(id, session.user.id);

      return NextResponse.json({ timeline });
    } catch (error) {
      return handleRouteError(error, "GET /api/applications/[id]/timeline");
    }
  },
);
