import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-error";
import { getClientIp } from "@/lib/request-ip";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requestPasswordReset } from "@/services/auth.service";
import { forgotPasswordSchema } from "@/types/auth";

const FORGOT_PASSWORD_RATE_LIMIT = 5;
const FORGOT_PASSWORD_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

export async function POST(request: Request) {
  try {
    await enforceRateLimit(
      `forgot-password:${getClientIp(request)}`,
      FORGOT_PASSWORD_RATE_LIMIT,
      FORGOT_PASSWORD_RATE_LIMIT_WINDOW_SECONDS,
    );

    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    await requestPasswordReset(email);

    // Always respond with success, whether or not the account exists, so
    // this endpoint can't be used to enumerate emails.
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "POST /api/auth/forgot-password");
  }
}
