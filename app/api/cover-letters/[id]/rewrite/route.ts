import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { rewriteCoverLetter } from "@/services/cover-letter.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const coverLetter = await rewriteCoverLetter(id, session.user.id, body);

    return NextResponse.json({ coverLetter });
  } catch (error) {
    return handleRouteError(error, "POST /api/cover-letters/[id]/rewrite");
  }
}
