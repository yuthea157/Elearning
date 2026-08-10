"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { startSubscriptionCheckoutAction } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";

export function SubscribeButton({ isLoggedIn, isSubscribed }: { isLoggedIn: boolean; isSubscribed: boolean }) {
  const [isPending, startTransition] = useTransition();

  if (isSubscribed) {
    return (
      <Button asChild variant="outline">
        <Link href="/settings">Manage subscription</Link>
      </Button>
    );
  }

  if (!isLoggedIn) {
    return (
      <Button asChild>
        <Link href="/login?next=/pricing">Sign in to subscribe</Link>
      </Button>
    );
  }

  return (
    <Button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await startSubscriptionCheckoutAction();
          } catch {
            toast.error("Couldn't start checkout — please try again.");
          }
        })
      }
    >
      {isPending ? "Redirecting to checkout…" : "Go Premium"}
    </Button>
  );
}
