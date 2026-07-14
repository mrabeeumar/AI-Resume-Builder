import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import {
  createJobApplication,
  listJobApplicationsForUser,
} from "@/services/job-application.service";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = {
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      company: searchParams.get("company") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    };

    const result = await listJobApplicationsForUser(session.user.id, query as never);

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, "GET /api/applications");
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const application = await createJobApplication(body, session.user.id);

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/applications");
  }
}
