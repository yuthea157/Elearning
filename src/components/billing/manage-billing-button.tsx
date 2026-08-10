"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { openBillingPortalAction } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";

export function ManageBillingButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await openBillingPortalAction();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't open billing portal.");
          }
        })
      }
    >
      {isPending ? "Opening…" : "Manage billing"}
    </Button>
  );
}
