"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { markLessonCompleteAction } from "@/app/actions/learning";
import { Button } from "@/components/ui/button";

export function MarkCompleteButton({ lessonId, isCompleted }: { lessonId: string; isCompleted: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (isCompleted) {
    return (
      <Button variant="outline" disabled className="gap-1.5 text-success">
        <CheckCircle2 className="size-4" /> Completed
      </Button>
    );
  }

  return (
    <Button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const { justCompleted, certificateCode } = await markLessonCompleteAction(lessonId);
          if (justCompleted && certificateCode) {
            toast.success("Course complete! Your certificate is ready.", {
              action: { label: "View certificate", onClick: () => router.push(`/certificates/${certificateCode}`) },
            });
          }
          router.refresh();
        })
      }
    >
      {isPending ? "Saving…" : "Mark complete"}
    </Button>
  );
}
