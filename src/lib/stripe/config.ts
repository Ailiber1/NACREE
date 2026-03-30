import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

export function isStripeConfigured(): boolean {
  return (
    stripeSecretKey !== "" &&
    !stripeSecretKey.startsWith("sk_test_YOUR")
  );
}

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return stripeInstance;
}

export function getPublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
}

export function isPublishableKeyConfigured(): boolean {
  const key = getPublishableKey();
  return key !== "" && !key.startsWith("pk_test_YOUR");
}
