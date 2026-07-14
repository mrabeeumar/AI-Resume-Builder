import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import {
  deleteVersion,
  getVersionForResume,
} from "@/services/resume-version.service";

type RouteParams = { params: Promise<{ id: string; versionId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id, versionId } = await params;

  try {
    const version = await getVersionForResume(id, versionId, session.user.id);

    return NextResponse.json({ version });
  } catch (error) {
    return handleRouteError(error, "GET /api/resumes/[id]/versions/[versionId]");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id, versionId } = await params;

  try {
    await deleteVersion(id, versionId, session.user.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(
      error,
      "DELETE /api/resumes/[id]/versions/[versionId]",
    );
  }
}
