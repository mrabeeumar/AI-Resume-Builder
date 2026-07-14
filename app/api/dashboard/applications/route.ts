import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { getJobApplicationsDashboardData } from "@/services/job-application.service";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const dashboard = await getJobApplicationsDashboardData(session.user.id);

    return NextResponse.json({ dashboard });
  } catch (error) {
    return handleRouteError(error, "GET /api/dashboard/applications");
  }
}
