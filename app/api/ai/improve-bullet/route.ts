import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { improveBullet } from "@/services/ai-resume.service";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await improveBullet(session.user.id, body);

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, "POST /api/ai/improve-bullet");
  }
}
