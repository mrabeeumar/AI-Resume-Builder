import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { saveTailoredResume } from "@/services/resume-tailoring.service";

import { withRequestLog } from "@/lib/api-log";
type RouteParams = { params: Promise<{ id: string }> };

// Persists a previously generated tailoring preview (see
// POST /api/resumes/[id]/tailor) as a new ResumeVersion. The live resume
// and its sections are left untouched.
export const POST = withRequestLog(
  "POST /api/resumes/[id]/tailor/save",
  async (request: Request, { params }: RouteParams) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const body = await request.json().catch(() => ({}));
      const version = await saveTailoredResume(id, session.user.id, body);

      return NextResponse.json({ version });
    } catch (error) {
      return handleRouteError(error, "POST /api/resumes/[id]/tailor/save");
    }
  },
);
