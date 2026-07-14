import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { compareVersions } from "@/services/resume-version.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Both 'from' and 'to' version ids are required." },
      { status: 422 },
    );
  }

  try {
    const comparison = await compareVersions(id, from, to, session.user.id);

    return NextResponse.json(comparison);
  } catch (error) {
    return handleRouteError(error, "GET /api/resumes/[id]/versions/compare");
  }
}
