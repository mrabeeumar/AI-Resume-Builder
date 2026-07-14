import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import {
  deleteJobDescription,
  getJobDescriptionForUser,
  updateJobDescription,
} from "@/services/job-description.service";

type RouteParams = { params: Promise<{ id: string }> };

export const GET = withRequestLog(
  "GET /api/job-descriptions/[id]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const jobDescription = await getJobDescriptionForUser(
        id,
        session.user.id,
      );

      return NextResponse.json({ jobDescription });
    } catch (error) {
      return handleRouteError(error, "GET /api/job-descriptions/[id]");
    }
  },
);

export const PATCH = withRequestLog(
  "PATCH /api/job-descriptions/[id]",
  async (request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const body = await request.json();
      const jobDescription = await updateJobDescription(
        id,
        body,
        session.user.id,
      );

      return NextResponse.json({ jobDescription });
    } catch (error) {
      return handleRouteError(error, "PATCH /api/job-descriptions/[id]");
    }
  },
);

export const DELETE = withRequestLog(
  "DELETE /api/job-descriptions/[id]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      await deleteJobDescription(id, session.user.id);

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return handleRouteError(error, "DELETE /api/job-descriptions/[id]");
    }
  },
);
