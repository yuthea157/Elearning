"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { toggleBookmarkAction } from "@/app/actions/bookmarks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BookmarkButton({
  courseId,
  courseSlug,
  initiallyBookmarked,
  isLoggedIn,
}: {
  courseId: string;
  courseSlug: string;
  initiallyBookmarked: boolean;
  isLoggedIn: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(initiallyBookmarked);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full gap-1.5"
      disabled={isPending}
      onClick={() => {
        if (!isLoggedIn) {
          router.push(`/login?next=/courses/${courseSlug}`);
          return;
        }
        // Optimistic — safe here since a failed toggle just reverts the icon, no data loss risk.
        setBookmarked((prev) => !prev);
        startTransition(async () => {
          try {
            await toggleBookmarkAction(courseId, courseSlug);
          } catch {
            setBookmarked((prev) => !prev);
            toast.error("Couldn't update saved courses — please try again.");
          }
        });
      }}
    >
      <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
      {bookmarked ? "Saved" : "Save"}
    </Button>
  );
}
