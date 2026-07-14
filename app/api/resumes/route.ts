import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import { createResume, listResumesForUser } from "@/services/resume.service";

export const GET = withRequestLog("GET /api/resumes", async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const resumes = await listResumesForUser(session.user.id);

  return NextResponse.json({ resumes });
});

export const POST = withRequestLog(
  "POST /api/resumes",
  async (request: Request) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
      const body = await request.json();
      const resume = await createResume(body, session.user.id);

      return NextResponse.json({ resume }, { status: 201 });
    } catch (error) {
      return handleRouteError(error, "POST /api/resumes");
    }
  },
);
