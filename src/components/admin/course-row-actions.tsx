"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { setCourseFeaturedAction, setCourseModerationAction } from "@/app/actions/admin-courses";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CourseRowActions({
  courseId,
  isFeatured,
  moderationStatus,
}: {
  courseId: string;
  isFeatured: boolean;
  moderationStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center justify-end gap-2">
      <Select
        value={moderationStatus}
        onValueChange={(value) =>
          startTransition(async () => {
            try {
              await setCourseModerationAction(courseId, value as "APPROVED" | "REJECTED" | "SUSPENDED");
              toast.success("Moderation status updated.");
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Something went wrong.");
            }
          })
        }
      >
        <SelectTrigger size="sm" className="w-[110px]" disabled={isPending}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
          <SelectItem value="SUSPENDED">Suspended</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="icon-sm"
        variant={isFeatured ? "default" : "outline"}
        disabled={isPending}
        aria-label={isFeatured ? "Unfeature course" : "Feature course"}
        onClick={() =>
          startTransition(async () => {
            await setCourseFeaturedAction(courseId, !isFeatured);
            router.refresh();
          })
        }
      >
        <Star className={isFeatured ? "fill-current" : ""} />
      </Button>
    </div>
  );
}
