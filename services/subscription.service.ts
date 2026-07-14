import type Stripe from "stripe";

import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import {
  createCheckoutSessionSchema,
  type CreateCheckoutSessionInput,
} from "@/types/billing";

const AI_USAGE_WINDOW_DAYS = 30;

export class SubscriptionServiceError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "SubscriptionServiceError";
  }
}

type PaidPlan = CreateCheckoutSessionInput["plan"];

function getPlanPriceId(plan: PaidPlan): string {
  const priceId =
    plan === "PRO"
      ? process.env.STRIPE_PRICE_ID_PRO
      : process.env.STRIPE_PRICE_ID_TEAM;

  if (!priceId) {
    throw new SubscriptionServiceError(
      `Billing is not configured for the ${plan} plan.`,
      500,
    );
  }

  return priceId;
}

// FREE-plan quotas. `null` means unlimited. Not DB-backed, matching the
// in-file-constant style already used for other derived dashboard data.
const RESUME_LIMITS: Record<SubscriptionPlan, number | null> = {
  FREE: 3,
  PRO: null,
  TEAM: null,
};

const AI_CALL_LIMITS: Record<SubscriptionPlan, number | null> = {
  FREE: 20,
  PRO: null,
  TEAM: null,
};

// Monthly AI-call allowance for a plan. `null` means unlimited. Exposed so
// UI surfaces (e.g. the profile menu) can show usage against the quota
// without re-declaring the limits.
export function getAICallLimit(plan: SubscriptionPlan): number | null {
  return AI_CALL_LIMITS[plan];
}

export interface SubscriptionSummary {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

const DEFAULT_SUBSCRIPTION: SubscriptionSummary = {
  plan: "FREE",
  status: "ACTIVE",
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

export async function getSubscriptionForUser(
  userId: string,
): Promise<SubscriptionSummary> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });

  return (subscription as SubscriptionSummary | null) ?? DEFAULT_SUBSCRIPTION;
}

async function getOrCreateStripeCustomerId(userId: string): Promise<string> {
  const existing = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (existing?.stripeCustomerId) {
    return existing.stripeCustomerId;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw new SubscriptionServiceError("User not found.", 404);
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId },
  });

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, stripeCustomerId: customer.id },
    update: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
  userId: string,
): Promise<{ url: string }> {
  const { plan } = createCheckoutSessionSchema.parse(input);
  const priceId = getPlanPriceId(plan);
  const customerId = await getOrCreateStripeCustomerId(userId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
    metadata: { userId, plan },
    subscription_data: { metadata: { userId, plan } },
  });

  if (!session.url) {
    throw new SubscriptionServiceError(
      "Unable to start checkout. Please try again.",
      502,
    );
  }

  return { url: session.url };
}

export async function createPortalSession(
  userId: string,
): Promise<{ url: string }> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (!subscription?.stripeCustomerId) {
    throw new SubscriptionServiceError("No billing account found.", 400);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appUrl}/dashboard/billing`,
  });

  return { url: session.url };
}

export async function assertCanCreateResume(userId: string): Promise<void> {
  const { plan } = await getSubscriptionForUser(userId);
  const limit = RESUME_LIMITS[plan];

  if (limit === null) {
    return;
  }

  const count = await prisma.resume.count({ where: { userId } });

  if (count >= limit) {
    throw new SubscriptionServiceError(
      "Resume limit reached for your plan. Upgrade to create more resumes.",
      403,
    );
  }
}

export async function assertWithinAIUsageLimit(userId: string): Promise<void> {
  const { plan } = await getSubscriptionForUser(userId);
  const limit = AI_CALL_LIMITS[plan];

  if (limit === null) {
    return;
  }

  const since = new Date(
    Date.now() - AI_USAGE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const count = await prisma.aIUsage.count({
    where: { userId, createdAt: { gte: since } },
  });

  if (count >= limit) {
    throw new SubscriptionServiceError(
      "AI usage limit reached for your plan. Upgrade for more AI calls.",
      403,
    );
  }
}

function toSubscriptionStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "incomplete":
    case "incomplete_expired":
      return "INCOMPLETE";
    case "unpaid":
      return "UNPAID";
    default:
      return "ACTIVE";
  }
}

function getPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items.data[0];
  return item?.current_period_end
    ? new Date(item.current_period_end * 1000)
    : null;
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan as SubscriptionPlan | undefined;
  const stripeSubscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;

  if (!userId || !plan || !stripeSubscriptionId) {
    return;
  }

  const subscription =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      status: toSubscriptionStatus(subscription.status),
      stripeCustomerId:
        typeof session.customer === "string" ? session.customer : undefined,
      stripeSubscriptionId,
      stripePriceId: subscription.items.data[0]?.price.id,
      currentPeriodEnd: getPeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      plan,
      status: toSubscriptionStatus(subscription.status),
      stripeSubscriptionId,
      stripePriceId: subscription.items.data[0]?.price.id,
      currentPeriodEnd: getPeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const plan = subscription.metadata?.plan as SubscriptionPlan | undefined;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      ...(plan ? { plan } : {}),
      status: toSubscriptionStatus(subscription.status),
      stripePriceId: subscription.items.data[0]?.price.id,
      currentPeriodEnd: getPeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      plan: "FREE",
      status: "CANCELED",
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: null,
      stripePriceId: null,
    },
  });
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const stripeSubscriptionId =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : (invoice.parent?.subscription_details?.subscription?.id ?? null);

  if (!stripeSubscriptionId) {
    return;
  }

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId },
    data: { status: "PAST_DUE" },
  });
}

// Central webhook dispatcher. Idempotent: Stripe redelivers events on
// timeout or non-2xx responses, so already-processed event IDs are recorded
// and skipped rather than reapplied.
export async function handleStripeWebhookEvent(
  event: Stripe.Event,
): Promise<void> {
  // Claim the event first so concurrent redeliveries can't double-process it.
  try {
    await prisma.stripeWebhookEvent.create({
      data: { stripeEventId: event.id, type: event.type },
    });
  } catch {
    // Unique constraint violation: this event was already processed.
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    // Release the claim so Stripe's redelivery can retry, instead of the
    // event being permanently marked processed after a transient failure.
    await prisma.stripeWebhookEvent
      .delete({ where: { stripeEventId: event.id } })
      .catch(() => undefined);
    throw error;
  }
}
