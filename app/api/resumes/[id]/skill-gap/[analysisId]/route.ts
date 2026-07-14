import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import {
  deleteSkillGapAnalysisForResume,
  getSkillGapAnalysisForResume,
} from "@/services/skill-gap-analysis.service";

type RouteParams = { params: Promise<{ id: string; analysisId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
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
    return handleRouteError(error, "GET /api/resumes/[id]/skill-gap/[analysisId]");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
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
}
