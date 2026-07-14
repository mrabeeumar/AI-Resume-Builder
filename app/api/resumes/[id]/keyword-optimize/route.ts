import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { optimizeKeywords } from "@/services/ai-resume.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const result = await optimizeKeywords(id, session.user.id, body);

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, "POST /api/resumes/[id]/keyword-optimize");
  }
}
