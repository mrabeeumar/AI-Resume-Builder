import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import {
  deleteConversation,
  getConversationWithMessages,
} from "@/services/chat-history.service";

type RouteParams = { params: Promise<{ id: string; conversationId: string }> };

export const GET = withRequestLog(
  "GET /api/resumes/[id]/assistant/conversations/[conversationId]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, conversationId } = await params;

    try {
      const conversation = await getConversationWithMessages(
        id,
        conversationId,
        session.user.id,
      );

      return NextResponse.json({ conversation });
    } catch (error) {
      return handleRouteError(
        error,
        "GET /api/resumes/[id]/assistant/conversations/[conversationId]",
      );
    }
  },
);

export const DELETE = withRequestLog(
  "DELETE /api/resumes/[id]/assistant/conversations/[conversationId]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, conversationId } = await params;

    try {
      await deleteConversation(id, conversationId, session.user.id);

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleRouteError(
        error,
        "DELETE /api/resumes/[id]/assistant/conversations/[conversationId]",
      );
    }
  },
);
