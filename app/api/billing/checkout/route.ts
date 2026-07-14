import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createCheckoutSession } from "@/services/subscription.service";

const CHECKOUT_RATE_LIMIT = 10;
const CHECKOUT_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

export const POST = withRequestLog(
  "POST /api/billing/checkout",
  async (request: Request) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
      await enforceRateLimit(
        `billing:checkout:${session.user.id}`,
        CHECKOUT_RATE_LIMIT,
        CHECKOUT_RATE_LIMIT_WINDOW_SECONDS,
      );

      const body = await request.json();
      const { url } = await createCheckoutSession(body, session.user.id);

      return NextResponse.json({ url });
    } catch (error) {
      return handleRouteError(error, "POST /api/billing/checkout");
    }
  },
);
