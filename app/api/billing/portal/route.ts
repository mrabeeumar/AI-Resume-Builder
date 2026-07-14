import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { createPortalSession } from "@/services/subscription.service";

export async function POST() {
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
}
