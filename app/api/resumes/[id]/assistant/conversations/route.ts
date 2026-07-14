import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import {
  createConversation,
  listConversationsForResume,
} from "@/services/chat-history.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const conversations = await listConversationsForResume(id, session.user.id);

    return NextResponse.json({ conversations });
  } catch (error) {
    return handleRouteError(error, "GET /api/resumes/[id]/assistant/conversations");
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const conversation = await createConversation(id, session.user.id, body);

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/resumes/[id]/assistant/conversations");
  }
}
