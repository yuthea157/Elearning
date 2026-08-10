import "server-only";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/billing/stripe-client";
import { createNotification } from "@/lib/services/notifications";

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status, isDeleted: boolean): "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED" {
  if (isDeleted) return "EXPIRED";
  if (status === "active" || status === "trialing") return "ACTIVE";
  if (status === "past_due" || status === "incomplete") return "PAST_DUE";
  if (status === "canceled") return "CANCELLED";
  return "EXPIRED"; // unpaid, incomplete_expired
}

/**
 * Entry point for every Stripe webhook event this app handles. Only
 * `checkout.session.completed` and `invoice.payment_succeeded` create a
 * `Payment` row, so only those two are guarded by
 * `Payment.idempotencyKey` (unique on the Stripe event id) — a retried
 * delivery of either is a no-op. `customer.subscription.*` events instead
 * carry Stripe's full current subscription state on every delivery, so
 * reapplying the same one twice is already harmless (it's a replace, not
 * an append) and doesn't need its own dedup check.
 */
export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object, event.id);
      break;
    case "invoice.payment_succeeded":
      await handleInvoicePaymentSucceeded(event.data.object, event.id);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionChanged(event.data.object, false);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionChanged(event.data.object, true);
      break;
    case "checkout.session.async_payment_failed":
      await handleCheckoutSessionFailed(event.data.object);
      break;
    default:
    // Not an event this app acts on — Stripe sends many more event types
    // than are subscribed to in the dashboard/CLI; ignoring the rest is
    // expected, not an error.
  }
}

async function alreadyProcessed(eventId: string) {
  const existing = await prisma.payment.findUnique({ where: { idempotencyKey: eventId } });
  return !!existing;
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, eventId: string) {
  if (await alreadyProcessed(eventId)) return;

  const kind = session.metadata?.kind;
  const amount = (session.amount_total ?? 0) / 100;

  if (kind === "course_purchase") {
    const { orderId, userId, courseId } = session.metadata as { orderId: string; userId: string; courseId: string };
    if (!orderId || !userId || !courseId) return;

    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } }),
      prisma.payment.create({
        data: {
          userId,
          orderId,
          amount,
          provider: "STRIPE",
          providerPaymentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
          idempotencyKey: eventId,
          status: "SUCCEEDED",
        },
      }),
      prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: {},
        create: { userId, courseId, source: "PURCHASE" },
      }),
      prisma.course.update({ where: { id: courseId }, data: { enrollmentCount: { increment: 1 } } }),
    ]);
    return;
  }

  if (kind === "premium_subscription") {
    const userId = session.metadata?.userId;
    const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : null;
    if (!userId || !stripeSubscriptionId) return;

    const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const currentPeriodEnd = stripeSub.items.data[0]?.current_period_end;
    const currentPeriodStart = stripeSub.items.data[0]?.current_period_start;

    await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.upsert({
        where: { providerSubscriptionId: stripeSubscriptionId },
        update: {
          status: "ACTIVE",
          currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : undefined,
          currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : undefined,
        },
        create: {
          userId,
          plan: "PREMIUM",
          status: "ACTIVE",
          provider: "STRIPE",
          providerSubscriptionId: stripeSubscriptionId,
          currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : null,
          currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
        },
      });
      await tx.payment.create({
        data: {
          userId,
          subscriptionId: subscription.id,
          amount,
          provider: "STRIPE",
          providerPaymentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
          idempotencyKey: eventId,
          status: "SUCCEEDED",
        },
      });
    });

    await createNotification({
      userId,
      type: "SUBSCRIPTION_EVENT",
      title: "Welcome to Premium",
      body: "Your Premium subscription is active — enjoy the full course catalog.",
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, eventId: string) {
  if (await alreadyProcessed(eventId)) return;

  const stripeSubscriptionId = invoice.parent?.subscription_details?.subscription;
  if (!stripeSubscriptionId || typeof stripeSubscriptionId !== "string") return; // one-time invoice, not a renewal

  const subscription = await prisma.subscription.findUnique({ where: { providerSubscriptionId: stripeSubscriptionId } });
  if (!subscription) return; // renewal for a subscription this app didn't originate — ignore

  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const currentPeriodEnd = stripeSub.items.data[0]?.current_period_end;
  const currentPeriodStart = stripeSub.items.data[0]?.current_period_start;

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "ACTIVE",
        currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : undefined,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : undefined,
      },
    }),
    prisma.payment.create({
      data: {
        userId: subscription.userId,
        subscriptionId: subscription.id,
        amount: (invoice.amount_paid ?? 0) / 100,
        provider: "STRIPE",
        providerPaymentId: invoice.id ?? null,
        idempotencyKey: eventId,
        status: "SUCCEEDED",
      },
    }),
  ]);
}

async function handleSubscriptionChanged(stripeSub: Stripe.Subscription, isDeleted: boolean) {
  const subscription = await prisma.subscription.findUnique({ where: { providerSubscriptionId: stripeSub.id } });
  if (!subscription) return;

  const newStatus = mapStripeSubscriptionStatus(stripeSub.status, isDeleted);
  const currentPeriodEnd = stripeSub.items.data[0]?.current_period_end;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: newStatus,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : undefined,
    },
  });

  // Only notify on an actual transition into one of these states, not
  // every update event Stripe sends for a subscription already there.
  if (newStatus !== subscription.status && (newStatus === "PAST_DUE" || newStatus === "EXPIRED" || newStatus === "CANCELLED")) {
    const body =
      newStatus === "PAST_DUE"
        ? "We couldn't process your last Premium payment — please update your payment method."
        : "Your Premium subscription has ended. You can resubscribe anytime from Pricing.";
    await createNotification({
      userId: subscription.userId,
      type: "SUBSCRIPTION_EVENT",
      title: newStatus === "PAST_DUE" ? "Payment failed" : "Subscription ended",
      body,
    });
  }
}

async function handleCheckoutSessionFailed(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  await prisma.order.update({ where: { id: orderId }, data: { status: "FAILED" } });
}
