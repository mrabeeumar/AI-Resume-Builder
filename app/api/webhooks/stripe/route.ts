import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { handleStripeWebhookEvent } from "@/services/subscription.service";

// Stripe calls this endpoint directly — there is no user session, and the
// payload must be read as raw text (not parsed as JSON) for signature
// verification. Never trust the payload before constructEvent succeeds.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error(
      "[api] POST /api/webhooks/stripe: signature verification failed",
      error,
    );
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    await handleStripeWebhookEvent(event);
  } catch (error) {
    console.error("[api] POST /api/webhooks/stripe", error);
    return NextResponse.json(
      { error: "Webhook handling failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
