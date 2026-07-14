import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { getVersionForCoverLetter } from "@/services/cover-letter-version.service";

type RouteParams = { params: Promise<{ id: string; versionId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id, versionId } = await params;

  try {
    const version = await getVersionForCoverLetter(
      id,
      versionId,
      session.user.id,
    );

    return NextResponse.json({ version });
  } catch (error) {
    return handleRouteError(
      error,
      "GET /api/cover-letters/[id]/versions/[versionId]",
    );
  }
}
