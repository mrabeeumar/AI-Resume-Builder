import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import {
  createSection,
  listSectionsForResume,
} from "@/services/resume-section.service";

type RouteParams = { params: Promise<{ id: string }> };

export const GET = withRequestLog(
  "GET /api/resumes/[id]/sections",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const sections = await listSectionsForResume(id, session.user.id);

      return NextResponse.json({ sections });
    } catch (error) {
      return handleRouteError(error, "GET /api/resumes/[id]/sections");
    }
  },
);

export const POST = withRequestLog(
  "POST /api/resumes/[id]/sections",
  async (request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const body = await request.json();
      const section = await createSection(id, session.user.id, body);

      return NextResponse.json({ section }, { status: 201 });
    } catch (error) {
      return handleRouteError(error, "POST /api/resumes/[id]/sections");
    }
  },
);
