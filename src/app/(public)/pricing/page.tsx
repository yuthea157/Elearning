import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { getOptionalCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PREMIUM_PLAN } from "@/lib/billing/plans";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pricing — E-Learning" };

const FREE_FEATURES = ["Access to free courses", "Progress tracking", "Certificates for free courses", "Community discussions"];
const PREMIUM_FEATURES = [
  "Everything in Free",
  "Full course catalog, including paid courses",
  "Downloadable resources",
  "Priority support",
  "Cancel anytime",
];

export default async function PricingPage() {
  const user = await getOptionalCurrentUser();
  const activeSubscription = user ? await prisma.subscription.findFirst({ where: { userId: user.id, status: "ACTIVE" } }) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">Simple, transparent pricing</h1>
        <p className="mt-3 text-muted-foreground">Start free. Upgrade whenever you&apos;re ready for the full catalog.</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Free</h2>
            <p className="mt-1">
              <span className="text-3xl font-semibold text-foreground">$0</span>
              <span className="text-sm text-muted-foreground"> forever</span>
            </p>
          </div>
          <ul className="flex flex-1 flex-col gap-2">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline">
            <Link href={user ? "/courses" : "/register"}>{user ? "Explore courses" : "Start free"}</Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-primary bg-primary-subtle/40 p-6">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Premium</h2>
            <p className="mt-1">
              <span className="text-3xl font-semibold text-foreground">${(PREMIUM_PLAN.amountCents / 100).toFixed(0)}</span>
              <span className="text-sm text-muted-foreground"> /month</span>
            </p>
          </div>
          <ul className="flex flex-1 flex-col gap-2">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
          <SubscribeButton isLoggedIn={!!user} isSubscribed={!!activeSubscription} />
        </div>
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Prefer to pay per course? Every course also shows its own price on its course page — no subscription required.
      </p>
    </div>
  );
}
