import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { reorderSections } from "@/services/resume-section.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const sections = await reorderSections(id, session.user.id, body);

    return NextResponse.json({ sections });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/resumes/[id]/sections/reorder");
  }
}
