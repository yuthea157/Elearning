import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe-client";
import { handleStripeWebhookEvent } from "@/lib/billing/webhook";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe requires the exact raw request body (not re-serialized JSON) to
// verify the signature — parsing and re-stringifying would produce a
// byte-for-byte different payload and always fail verification.
export async function POST(request: Request) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set — refusing to process webhook.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleStripeWebhookEvent(event);
  } catch (err) {
    // Non-2xx tells Stripe to retry — safe, since every handler is
    // idempotent (see src/lib/billing/webhook.ts).
    console.error(`Error handling Stripe webhook event ${event.id} (${event.type}):`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
