import { NextResponse } from "next/server";
import { after } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import {
  createAiJob,
  markAiJobCompleted,
  markAiJobFailed,
  markAiJobProcessing,
} from "@/services/ai-job.service";
import {
  generateAndSaveAtsReport,
  listAtsReportsForResume,
} from "@/services/ats.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const reports = await listAtsReportsForResume(id, session.user.id);

    return NextResponse.json({ reports });
  } catch (error) {
    return handleRouteError(error, "GET /api/resumes/[id]/ats-analysis");
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  try {
    const body = await request.json().catch(() => ({}));
    const job = await createAiJob(id, userId, "ATS_ANALYSIS", body);

    after(async () => {
      try {
        await markAiJobProcessing(job.id);
        const result = await generateAndSaveAtsReport(id, userId, body);
        await markAiJobCompleted(job.id, result);
      } catch (error) {
        await markAiJobFailed(
          job.id,
          error instanceof Error ? error.message : "Something went wrong.",
        );
      }
    });

    return NextResponse.json({ jobId: job.id }, { status: 202 });
  } catch (error) {
    return handleRouteError(error, "POST /api/resumes/[id]/ats-analysis");
  }
}
