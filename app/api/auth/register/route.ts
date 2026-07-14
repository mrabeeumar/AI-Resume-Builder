import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-error";
import { getClientIp } from "@/lib/request-ip";
import { enforceRateLimit } from "@/lib/rate-limit";
import { registerUser } from "@/services/auth.service";

const REGISTER_RATE_LIMIT = 10;
const REGISTER_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

export async function POST(request: Request) {
  try {
    await enforceRateLimit(
      `register:${getClientIp(request)}`,
      REGISTER_RATE_LIMIT,
      REGISTER_RATE_LIMIT_WINDOW_SECONDS,
    );

    const body = await request.json();
    const user = await registerUser(body);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/auth/register");
  }
}
