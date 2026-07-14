import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import {
  listInterviewsForResume,
  startInterview,
} from "@/services/interview.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const sessions = await listInterviewsForResume(id, session.user.id);
    return NextResponse.json({ sessions });
  } catch (error) {
    return handleRouteError(error, "GET /api/resumes/[id]/interviews");
  }
}

// Starts a new mock interview session and generates the first question
// synchronously — a single AI call, unlike the longer tailoring/review/
// skill-gap jobs, so it doesn't need the AiJob background pattern (mirrors
// the synchronous turn-based pattern in
// app/api/resumes/[id]/assistant/conversations/route.ts).
export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const input = await request.json().catch(() => ({}));
    const reply = await startInterview(id, session.user.id, input);
    return NextResponse.json({ interview: reply }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/resumes/[id]/interviews");
  }
}
