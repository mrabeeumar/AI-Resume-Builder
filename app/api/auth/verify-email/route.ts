import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-error";
import { verifyEmailToken } from "@/services/auth.service";
import { verifyEmailSchema } from "@/types/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = verifyEmailSchema.parse(body);

    await verifyEmailToken(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "POST /api/auth/verify-email");
  }
}
