import Stripe from "stripe";

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

// Lazily constructed so importing this module (e.g. transitively, via
// services/subscription.service.ts) never fails for routes/pages that don't
// actually perform a Stripe call — only accessing `stripe` does, and only
// when STRIPE_SECRET_KEY is required to be set.
function createStripeClient(): Stripe {
  if (!globalForStripe.stripe) {
    globalForStripe.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
      apiVersion: "2026-06-24.dahlia",
    });
  }

  return globalForStripe.stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, property, receiver) {
    return Reflect.get(createStripeClient(), property, receiver);
  },
});
