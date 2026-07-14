import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { getProfileSummary } from "@/services/profile.service";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const profile = await getProfileSummary(session.user.id);

    return NextResponse.json({ profile });
  } catch (error) {
    return handleRouteError(error, "GET /api/profile/summary");
  }
}
