import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import {
  deleteJobInterview,
  updateJobInterview,
} from "@/services/job-interview.service";

type RouteParams = { params: Promise<{ id: string }> };

export const PATCH = withRequestLog(
  "PATCH /api/interviews/[id]",
  async (request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const body = await request.json();
      const interview = await updateJobInterview(id, body, session.user.id);

      return NextResponse.json({ interview });
    } catch (error) {
      return handleRouteError(error, "PATCH /api/interviews/[id]");
    }
  },
);

export const DELETE = withRequestLog(
  "DELETE /api/interviews/[id]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      await deleteJobInterview(id, session.user.id);

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return handleRouteError(error, "DELETE /api/interviews/[id]");
    }
  },
);
