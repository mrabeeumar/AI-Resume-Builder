import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-error";
import { getClientIp } from "@/lib/request-ip";
import { enforceRateLimit } from "@/lib/rate-limit";
import { resendVerificationEmail } from "@/services/auth.service";
import { resendVerificationSchema } from "@/types/auth";

const RESEND_RATE_LIMIT = 5;
const RESEND_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

export async function POST(request: Request) {
  try {
    await enforceRateLimit(
      `resend-verification:${getClientIp(request)}`,
      RESEND_RATE_LIMIT,
      RESEND_RATE_LIMIT_WINDOW_SECONDS,
    );

    const body = await request.json();
    const { email } = resendVerificationSchema.parse(body);

    await resendVerificationEmail(email);

    // Always respond with success, whether or not the account exists or is
    // already verified, so this endpoint can't be used to enumerate emails.
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, "POST /api/auth/resend-verification");
  }
}
