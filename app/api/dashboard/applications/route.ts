import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { getJobApplicationsDashboardData } from "@/services/job-application.service";

import { withRequestLog } from "@/lib/api-log";
export const GET = withRequestLog(
  "GET /api/dashboard/applications",
  async () => {
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
  },
);
