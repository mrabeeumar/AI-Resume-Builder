import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-error";
import { getClientIp } from "@/lib/request-ip";
import { enforceRateLimit } from "@/lib/rate-limit";
import { resetPassword } from "@/services/auth.service";
import { resetPasswordSchema } from "@/types/auth";

const RESET_PASSWORD_RATE_LIMIT = 10;
const RESET_PASSWORD_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

export async function POST(request: Request) {
  try {
    await enforceRateLimit(
      `reset-password:${getClientIp(request)}`,
      RESET_PASSWORD_RATE_LIMIT,
      RESET_PASSWORD_RATE_LIMIT_WINDOW_SECONDS,
    );

    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    await resetPassword(token, password);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "POST /api/auth/reset-password");
  }
}
