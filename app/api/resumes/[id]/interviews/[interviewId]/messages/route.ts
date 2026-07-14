import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { submitInterviewAnswer } from "@/services/interview.service";

type RouteParams = { params: Promise<{ id: string; interviewId: string }> };

// Processes one interview turn: the candidate's answer to the current
// question. Reuses the chat-turn request shape ({ message }) implied by the
// roadmap's /api/interviews/message endpoint, scoped under the owning
// resume per this codebase's nesting convention (see
// app/api/resumes/[id]/assistant/conversations/[conversationId]/messages).
export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id, interviewId } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const input = { answer: body?.answer ?? body?.message };
    const reply = await submitInterviewAnswer(id, interviewId, session.user.id, input);
    return NextResponse.json({ reply });
  } catch (error) {
    return handleRouteError(
      error,
      "POST /api/resumes/[id]/interviews/[interviewId]/messages",
    );
  }
}
