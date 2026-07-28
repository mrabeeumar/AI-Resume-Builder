import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import {
  deleteAtsReportForResume,
  getAtsReportForResume,
} from "@/services/ats.service";

type RouteParams = { params: Promise<{ id: string; reportId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id, reportId } = await params;

  try {
    const report = await getAtsReportForResume(id, reportId, session.user.id);

    return NextResponse.json({ report });
  } catch (error) {
    return handleRouteError(
      error,
      "GET /api/resumes/[id]/ats-analysis/[reportId]",
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id, reportId } = await params;

  try {
    await deleteAtsReportForResume(id, reportId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(
      error,
      "DELETE /api/resumes/[id]/ats-analysis/[reportId]",
    );
  }
}
