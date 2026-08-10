import "server-only";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/billing/stripe-client";

/** One Stripe Customer per user, created lazily on first checkout rather
 * than at registration — most users never buy anything. */
export async function getOrCreateStripeCustomerId(user: { id: string; email: string; name: string; stripeCustomerId: string | null }) {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id },
  });

  await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}
