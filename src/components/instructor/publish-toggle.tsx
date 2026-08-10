"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { setCoursePublishedAction } from "@/app/actions/instructor-courses";
import { Button } from "@/components/ui/button";

export function PublishToggle({ courseId, isPublished }: { courseId: string; isPublished: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant={isPublished ? "outline" : "default"}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await setCoursePublishedAction(courseId, !isPublished);
            toast.success(isPublished ? "Course unpublished." : "Course published!");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
          }
        })
      }
    >
      {isPublished ? (
        <>
          <EyeOff /> Unpublish
        </>
      ) : (
        <>
          <Eye /> Publish
        </>
      )}
    </Button>
  );
}
