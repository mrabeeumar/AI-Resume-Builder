import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import {
  deleteReviewForResume,
  getReviewForResume,
} from "@/services/resume-review.service";

type RouteParams = { params: Promise<{ id: string; reviewId: string }> };

export const GET = withRequestLog(
  "GET /api/resumes/[id]/review/[reviewId]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, reviewId } = await params;

    try {
      const review = await getReviewForResume(id, reviewId, session.user.id);

      return NextResponse.json({ review });
    } catch (error) {
      return handleRouteError(error, "GET /api/resumes/[id]/review/[reviewId]");
    }
  },
);

export const DELETE = withRequestLog(
  "DELETE /api/resumes/[id]/review/[reviewId]",
  async (_request: Request, { params }: RouteParams) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id, reviewId } = await params;

    try {
      await deleteReviewForResume(id, reviewId, session.user.id);

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleRouteError(
        error,
        "DELETE /api/resumes/[id]/review/[reviewId]",
      );
    }
  },
);
