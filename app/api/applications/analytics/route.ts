import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { getApplicationAnalyticsForUser } from "@/services/job-application-analytics.service";

import { withRequestLog } from "@/lib/api-log";
export const GET = withRequestLog(
  "GET /api/applications/analytics",
  async () => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
      const analytics = await getApplicationAnalyticsForUser(session.user.id);

      return NextResponse.json({ analytics });
    } catch (error) {
      return handleRouteError(error, "GET /api/applications/analytics");
    }
  },
);
