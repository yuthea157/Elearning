"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateReviewAction } from "@/app/actions/admin-moderation";
import { Button } from "@/components/ui/button";

export function ReviewModerationActions({ reviewId }: { reviewId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => startTransition(async () => { await moderateReviewAction(reviewId, "APPROVED"); router.refresh(); })}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={() => startTransition(async () => { await moderateReviewAction(reviewId, "REMOVED"); router.refresh(); })}
      >
        Remove
      </Button>
    </div>
  );
}
