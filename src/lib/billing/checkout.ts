import "server-only";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/billing/stripe-client";
import { getOrCreateStripeCustomerId } from "@/lib/billing/customer";
import { PREMIUM_PLAN } from "@/lib/billing/plans";

type CheckoutUser = { id: string; email: string; name: string; stripeCustomerId: string | null };

/**
 * One-time purchase of a single course. Creates a PENDING Order up front
 * so there's a row to reconcile against even if the user abandons
 * checkout — the webhook handler flips it to PAID (or FAILED), it never
 * starts there.
 */
export async function createCourseCheckoutSession(
  user: CheckoutUser,
  course: { id: string; title: string; price: number },
  urls: { successUrl: string; cancelUrl: string }
) {
  const customerId = await getOrCreateStripeCustomerId(user);

  const order = await prisma.order.create({
    data: { userId: user.id, courseId: course.id, amount: course.price, status: "PENDING" },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: course.title },
          unit_amount: Math.round(course.price * 100),
        },
        quantity: 1,
      },
    ],
    success_url: urls.successUrl,
    cancel_url: urls.cancelUrl,
    metadata: { kind: "course_purchase", orderId: order.id, userId: user.id, courseId: course.id },
    // This Stripe account has Managed Payments (Stripe-as-merchant-of-record)
    // on by default, which requires a tax code per product — not relevant
    // for ad-hoc price_data line items with no pre-registered Product. Opt
    // out rather than assign an arbitrary tax code.
    managed_payments: { enabled: false },
  });

  return session;
}

/** Recurring Premium subscription — no pre-created Stripe Price object
 * needed; the plan's amount/interval (src/lib/billing/plans.ts) is sent
 * inline via price_data on every checkout. */
export async function createSubscriptionCheckoutSession(user: CheckoutUser, urls: { successUrl: string; cancelUrl: string }) {
  const customerId = await getOrCreateStripeCustomerId(user);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: PREMIUM_PLAN.currency,
          product_data: { name: PREMIUM_PLAN.name },
          unit_amount: PREMIUM_PLAN.amountCents,
          recurring: { interval: PREMIUM_PLAN.interval },
        },
        quantity: 1,
      },
    ],
    success_url: urls.successUrl,
    cancel_url: urls.cancelUrl,
    metadata: { kind: "premium_subscription", userId: user.id },
    managed_payments: { enabled: false },
  });

  return session;
}

/** Stripe-hosted portal for cancellation/payment-method management —
 * requires a Billing Portal configuration to exist on the Stripe account
 * (Dashboard → Settings → Billing → Customer portal); if none does, this
 * call fails and the caller should surface that rather than pretend it
 * worked. */
export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
}
