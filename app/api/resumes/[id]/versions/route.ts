import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import {
  createManualVersion,
  listVersionsForResume,
} from "@/services/resume-version.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const versions = await listVersionsForResume(id, session.user.id);

    return NextResponse.json({ versions });
  } catch (error) {
    return handleRouteError(error, "GET /api/resumes/[id]/versions");
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const version = await createManualVersion(id, session.user.id, body);

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/resumes/[id]/versions");
  }
}
