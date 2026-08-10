"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { reportReviewAction } from "@/app/actions/reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

export function ReportReviewButton({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
          <Flag className="size-3" /> Report
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this review</DialogTitle>
          <DialogDescription>Tell us why this review should be reviewed by a moderator.</DialogDescription>
        </DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What's wrong with this review?" rows={3} />
        <DialogFooter>
          <Button
            disabled={isPending || reason.trim().length < 3}
            onClick={() =>
              startTransition(async () => {
                try {
                  await reportReviewAction({ reviewId, reason });
                  toast.success("Thanks — a moderator will take a look.");
                  setOpen(false);
                  setReason("");
                  router.refresh();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Something went wrong.");
                }
              })
            }
          >
            {isPending ? "Submitting…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
