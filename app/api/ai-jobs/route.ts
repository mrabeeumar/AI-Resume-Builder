import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { listActiveAiJobsForUser } from "@/services/ai-job.service";

// Lets the client reattach to any AI jobs still running after a full page
// reload (e.g. the tab was reopened), so it can resume polling and still
// notify the user on completion.
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const jobs = await listActiveAiJobsForUser(session.user.id);

    return NextResponse.json({ jobs });
  } catch (error) {
    return handleRouteError(error, "GET /api/ai-jobs");
  }
}
