import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { createPortalSession } from "@/services/subscription.service";

import { withRequestLog } from "@/lib/api-log";
export const POST = withRequestLog("POST /api/billing/portal", async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { url } = await createPortalSession(session.user.id);

    return NextResponse.json({ url });
  } catch (error) {
    return handleRouteError(error, "POST /api/billing/portal");
  }
});
