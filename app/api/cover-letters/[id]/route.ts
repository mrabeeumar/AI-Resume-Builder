import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import {
  deleteCoverLetter,
  getCoverLetterForUser,
  updateCoverLetter,
} from "@/services/cover-letter.service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const coverLetter = await getCoverLetterForUser(id, session.user.id);

    return NextResponse.json({ coverLetter });
  } catch (error) {
    return handleRouteError(error, "GET /api/cover-letters/[id]");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const coverLetter = await updateCoverLetter(id, body, session.user.id);

    return NextResponse.json({ coverLetter });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/cover-letters/[id]");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteCoverLetter(id, session.user.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error, "DELETE /api/cover-letters/[id]");
  }
}
