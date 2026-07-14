import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import {
  deleteSection,
  updateSection,
} from "@/services/resume-section.service";

type RouteParams = { params: Promise<{ id: string; sectionId: string }> };

export const PATCH = withRequestLog(
  "PATCH /api/resumes/[id]/sections/[sectionId]",
  async (request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, sectionId } = await params;

    try {
      const body = await request.json();
      const section = await updateSection(id, sectionId, session.user.id, body);

      return NextResponse.json({ section });
    } catch (error) {
      return handleRouteError(
        error,
        "PATCH /api/resumes/[id]/sections/[sectionId]",
      );
    }
  },
);

export const DELETE = withRequestLog(
  "DELETE /api/resumes/[id]/sections/[sectionId]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, sectionId } = await params;

    try {
      await deleteSection(id, sectionId, session.user.id);

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return handleRouteError(
        error,
        "DELETE /api/resumes/[id]/sections/[sectionId]",
      );
    }
  },
);
