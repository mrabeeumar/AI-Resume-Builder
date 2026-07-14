import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { duplicateResume } from "@/services/resume.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const resume = await duplicateResume(id, session.user.id);

    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/resumes/[id]/duplicate");
  }
}
