import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import {
  deleteSkillGapAnalysisForResume,
  getSkillGapAnalysisForResume,
} from "@/services/skill-gap-analysis.service";

type RouteParams = { params: Promise<{ id: string; analysisId: string }> };

export const GET = withRequestLog(
  "GET /api/resumes/[id]/skill-gap/[analysisId]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, analysisId } = await params;

    try {
      const analysis = await getSkillGapAnalysisForResume(
        id,
        analysisId,
        session.user.id,
      );

      return NextResponse.json({ analysis });
    } catch (error) {
      return handleRouteError(
        error,
        "GET /api/resumes/[id]/skill-gap/[analysisId]",
      );
    }
  },
);

export const DELETE = withRequestLog(
  "DELETE /api/resumes/[id]/skill-gap/[analysisId]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, analysisId } = await params;

    try {
      await deleteSkillGapAnalysisForResume(id, analysisId, session.user.id);

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleRouteError(
        error,
        "DELETE /api/resumes/[id]/skill-gap/[analysisId]",
      );
    }
  },
);
