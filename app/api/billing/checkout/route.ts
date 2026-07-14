import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { createCheckoutSession } from "@/services/subscription.service";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url } = await createCheckoutSession(body, session.user.id);

    return NextResponse.json({ url });
  } catch (error) {
    return handleRouteError(error, "POST /api/billing/checkout");
  }
}
