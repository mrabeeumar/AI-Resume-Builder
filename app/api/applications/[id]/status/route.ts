import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { updateJobApplicationStatus } from "@/services/job-application.service";

import { withRequestLog } from "@/lib/api-log";
type RouteParams = { params: Promise<{ id: string }> };

export const PATCH = withRequestLog(
  "PATCH /api/applications/[id]/status",
  async (request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const body = await request.json();
      const application = await updateJobApplicationStatus(
        id,
        body,
        session.user.id,
      );

      return NextResponse.json({ application });
    } catch (error) {
      return handleRouteError(error, "PATCH /api/applications/[id]/status");
    }
  },
);
