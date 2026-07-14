import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import {
  deleteResume,
  getResumeForUser,
  updateResume,
} from "@/services/resume.service";

type RouteParams = { params: Promise<{ id: string }> };

export const GET = withRequestLog(
  "GET /api/resumes/[id]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const resume = await getResumeForUser(id, session.user.id);

      return NextResponse.json({ resume });
    } catch (error) {
      return handleRouteError(error, "GET /api/resumes/[id]");
    }
  },
);

export const PATCH = withRequestLog(
  "PATCH /api/resumes/[id]",
  async (request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const body = await request.json();
      const resume = await updateResume(id, body, session.user.id);

      return NextResponse.json({ resume });
    } catch (error) {
      return handleRouteError(error, "PATCH /api/resumes/[id]");
    }
  },
);

export const DELETE = withRequestLog(
  "DELETE /api/resumes/[id]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      await deleteResume(id, session.user.id);

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return handleRouteError(error, "DELETE /api/resumes/[id]");
    }
  },
);
