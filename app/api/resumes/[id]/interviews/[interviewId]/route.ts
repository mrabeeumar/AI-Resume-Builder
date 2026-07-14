import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { abandonInterview, getInterviewForResume } from "@/services/interview.service";

type RouteParams = { params: Promise<{ id: string; interviewId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id, interviewId } = await params;

  try {
    const interview = await getInterviewForResume(id, interviewId, session.user.id);
    return NextResponse.json({ interview });
  } catch (error) {
    return handleRouteError(error, "GET /api/resumes/[id]/interviews/[interviewId]");
  }
}

// Abandons an in-progress interview without generating a final report, so
// the candidate can leave a session cleanly instead of leaving it stuck
// IN_PROGRESS forever.
export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id, interviewId } = await params;

  try {
    await abandonInterview(id, interviewId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "DELETE /api/resumes/[id]/interviews/[interviewId]");
  }
}
