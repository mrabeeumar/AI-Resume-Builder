import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import {
  createJobInterview,
  listInterviewsForApplication,
} from "@/services/job-interview.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const interviews = await listInterviewsForApplication(id, session.user.id);

    return NextResponse.json({ interviews });
  } catch (error) {
    return handleRouteError(error, "GET /api/applications/[id]/interviews");
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const interview = await createJobInterview(id, body, session.user.id);

    return NextResponse.json({ interview }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/applications/[id]/interviews");
  }
}
