import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { createJobApplicationFromTailoring } from "@/services/job-application.service";

import { withRequestLog } from "@/lib/api-log";
export const POST = withRequestLog(
  "POST /api/applications/from-tailoring",
  async (request: Request) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
      const body = await request.json();
      const application = await createJobApplicationFromTailoring(
        body,
        session.user.id,
      );

      return NextResponse.json({ application }, { status: 201 });
    } catch (error) {
      return handleRouteError(error, "POST /api/applications/from-tailoring");
    }
  },
);
