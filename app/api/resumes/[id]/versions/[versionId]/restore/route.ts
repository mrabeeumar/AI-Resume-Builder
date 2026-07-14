import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { restoreVersion } from "@/services/resume-version.service";

import { withRequestLog } from "@/lib/api-log";
type RouteParams = { params: Promise<{ id: string; versionId: string }> };

export const POST = withRequestLog(
  "POST /api/resumes/[id]/versions/[versionId]/restore",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, versionId } = await params;

    try {
      const resume = await restoreVersion(id, versionId, session.user.id);

      return NextResponse.json({ resume });
    } catch (error) {
      return handleRouteError(
        error,
        "POST /api/resumes/[id]/versions/[versionId]/restore",
      );
    }
  },
);
