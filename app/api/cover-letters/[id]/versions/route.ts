import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import {
  createManualCoverLetterVersion,
  listVersionsForCoverLetter,
} from "@/services/cover-letter-version.service";

type RouteParams = { params: Promise<{ id: string }> };

export const GET = withRequestLog(
  "GET /api/cover-letters/[id]/versions",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const versions = await listVersionsForCoverLetter(id, session.user.id);

      return NextResponse.json({ versions });
    } catch (error) {
      return handleRouteError(error, "GET /api/cover-letters/[id]/versions");
    }
  },
);

export const POST = withRequestLog(
  "POST /api/cover-letters/[id]/versions",
  async (request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    try {
      const body = await request.json().catch(() => ({}));
      const version = await createManualCoverLetterVersion(
        id,
        session.user.id,
        body,
      );

      return NextResponse.json({ version }, { status: 201 });
    } catch (error) {
      return handleRouteError(error, "POST /api/cover-letters/[id]/versions");
    }
  },
);
