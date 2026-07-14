import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import {
  createResume,
  listResumesForUser,
} from "@/services/resume.service";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const resumes = await listResumesForUser(session.user.id);

  return NextResponse.json({ resumes });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const resume = await createResume(body, session.user.id);

    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/resumes");
  }
}
