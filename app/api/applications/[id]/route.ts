import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import {
  deleteJobApplication,
  getJobApplicationForUser,
  updateJobApplication,
} from "@/services/job-application.service";

type RouteParams = { params: Promise<{ id: string }> };

export const GET = withRequestLog(
  "GET /api/applications/[id]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const application = await getJobApplicationForUser(id, session.user.id);

      return NextResponse.json({ application });
    } catch (error) {
      return handleRouteError(error, "GET /api/applications/[id]");
    }
  },
);

export const PATCH = withRequestLog(
  "PATCH /api/applications/[id]",
  async (request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const body = await request.json();
      const application = await updateJobApplication(id, body, session.user.id);

      return NextResponse.json({ application });
    } catch (error) {
      return handleRouteError(error, "PATCH /api/applications/[id]");
    }
  },
);

export const DELETE = withRequestLog(
  "DELETE /api/applications/[id]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      await deleteJobApplication(id, session.user.id);

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return handleRouteError(error, "DELETE /api/applications/[id]");
    }
  },
);
