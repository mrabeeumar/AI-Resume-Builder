import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { sendMessage } from "@/services/resume-assistant.service";

type RouteParams = { params: Promise<{ id: string; conversationId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id, conversationId } = await params;

  try {
    const body = await request.json();
    const reply = await sendMessage(id, conversationId, session.user.id, body);

    return NextResponse.json({ reply });
  } catch (error) {
    return handleRouteError(
      error,
      "POST /api/resumes/[id]/assistant/conversations/[conversationId]/messages",
    );
  }
}
