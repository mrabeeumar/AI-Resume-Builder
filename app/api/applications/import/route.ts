import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { enforceRateLimit } from "@/lib/rate-limit";
import { importJobApplicationFromUrl } from "@/services/job-application-import.service";

const IMPORT_RATE_LIMIT = 20;
const IMPORT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await enforceRateLimit(
      `applications:import:${session.user.id}`,
      IMPORT_RATE_LIMIT,
      IMPORT_RATE_LIMIT_WINDOW_SECONDS,
    );

    const body = await request.json();
    const application = await importJobApplicationFromUrl(body, session.user.id);

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/applications/import");
  }
}
