import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { endInterview } from "@/services/interview.service";

import { withRequestLog } from "@/lib/api-log";
type RouteParams = { params: Promise<{ id: string; interviewId: string }> };

export const POST = withRequestLog(
  "POST /api/resumes/[id]/interviews/[interviewId]/end",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, interviewId } = await params;

    try {
      const reply = await endInterview(id, interviewId, session.user.id);
      return NextResponse.json(reply);
    } catch (error) {
      return handleRouteError(
        error,
        "POST /api/resumes/[id]/interviews/[interviewId]/end",
      );
    }
  },
);
