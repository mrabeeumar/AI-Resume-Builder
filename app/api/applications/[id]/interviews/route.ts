import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import {
  createJobInterview,
  listInterviewsForApplication,
} from "@/services/job-interview.service";

type RouteParams = { params: Promise<{ id: string }> };

export const GET = withRequestLog(
  "GET /api/applications/[id]/interviews",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const interviews = await listInterviewsForApplication(
        id,
        session.user.id,
      );

      return NextResponse.json({ interviews });
    } catch (error) {
      return handleRouteError(error, "GET /api/applications/[id]/interviews");
    }
  },
);

export const POST = withRequestLog(
  "POST /api/applications/[id]/interviews",
  async (request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const body = await request.json();
      const interview = await createJobInterview(id, body, session.user.id);

      return NextResponse.json({ interview }, { status: 201 });
    } catch (error) {
      return handleRouteError(error, "POST /api/applications/[id]/interviews");
    }
  },
);
