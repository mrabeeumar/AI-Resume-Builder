import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import {
  createCoverLetter,
  listCoverLettersForUser,
} from "@/services/cover-letter.service";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const coverLetters = await listCoverLettersForUser(session.user.id);

  return NextResponse.json({ coverLetters });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const coverLetter = await createCoverLetter(body, session.user.id);

    return NextResponse.json({ coverLetter }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/cover-letters");
  }
}
