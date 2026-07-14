import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import {
  createJobDescription,
  listJobDescriptionsForUser,
} from "@/services/job-description.service";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const jobDescriptions = await listJobDescriptionsForUser(session.user.id);

  return NextResponse.json({ jobDescriptions });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const jobDescription = await createJobDescription(body, session.user.id);

    return NextResponse.json({ jobDescription }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/job-descriptions");
  }
}
