import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { rewriteSection } from "@/services/ai-resume.service";

type RouteParams = { params: Promise<{ id: string; sectionId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id, sectionId } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const section = await rewriteSection(id, sectionId, session.user.id, body);

    return NextResponse.json({ section });
  } catch (error) {
    return handleRouteError(
      error,
      "POST /api/resumes/[id]/sections/[sectionId]/rewrite",
    );
  }
}
