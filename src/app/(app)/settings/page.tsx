import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, Bell } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { PREMIUM_PLAN } from "@/lib/billing/plans";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Settings — E-Learning" };

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  PAST_DUE: "Past due",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const [subscription, notificationPrefs] = await Promise.all([
    prisma.subscription.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.notificationPreference.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-heading text-2xl font-semibold text-foreground">Settings</h1>

      <section className="mb-8 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Account</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="text-foreground">{user.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="text-foreground">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Username</dt>
            <dd className="text-foreground">@{user.username}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">Billing</h2>
          <CreditCard className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>

        {subscription && subscription.status === "ACTIVE" ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-foreground">Premium plan</p>
              <Badge variant="secondary">{STATUS_LABEL[subscription.status]}</Badge>
              {subscription.cancelAtPeriodEnd && <Badge variant="outline">Cancelling at period end</Badge>}
            </div>
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {subscription.cancelAtPeriodEnd ? "Access ends" : "Renews"} on{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
            <ManageBillingButton />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              You&apos;re on the Free plan. Upgrade to Premium (${(PREMIUM_PLAN.amountCents / 100).toFixed(0)}/month) for the full course
              catalog.
            </p>
            <Button asChild className="w-fit">
              <Link href="/pricing">View plans</Link>
            </Button>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">Notifications</h2>
          <Bell className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <NotificationPreferences
          preferences={{
            emailEnabled: notificationPrefs?.emailEnabled ?? true,
            courseCompletionEnabled: notificationPrefs?.courseCompletionEnabled ?? true,
            newCourseEnabled: notificationPrefs?.newCourseEnabled ?? true,
            subscriptionEnabled: notificationPrefs?.subscriptionEnabled ?? true,
            systemEnabled: notificationPrefs?.systemEnabled ?? true,
          }}
        />
      </section>
    </div>
  );
}
