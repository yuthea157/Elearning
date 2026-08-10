"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { enrollAction } from "@/app/actions/learning";
import { startCourseCheckoutAction } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

export function EnrollButton({
  courseSlug,
  firstLessonId,
  isFree,
  isEnrolled,
  isLoggedIn,
  hasActiveSubscription,
  price,
}: {
  courseSlug: string;
  firstLessonId: string | null;
  isFree: boolean;
  isEnrolled: boolean;
  isLoggedIn: boolean;
  hasActiveSubscription: boolean;
  price: number;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (isEnrolled) {
    return (
      <Button asChild size="lg" className="w-full gap-1.5">
        <Link href={firstLessonId ? `/learn/${courseSlug}/${firstLessonId}` : "#"}>
          <CheckCircle2 className="size-4" /> Continue learning
        </Link>
      </Button>
    );
  }

  if (!isLoggedIn) {
    return (
      <Button asChild size="lg" className="w-full">
        <Link href={`/login?next=/courses/${courseSlug}`}>Sign in to enroll</Link>
      </Button>
    );
  }

  if (!isFree && !hasActiveSubscription) {
    return (
      <Button
        size="lg"
        className="w-full"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await startCourseCheckoutAction(courseSlug);
            } catch {
              toast.error("Couldn't start checkout — please try again.");
            }
          })
        }
      >
        {isPending ? "Redirecting to checkout…" : `Buy for ${formatPrice(price)}`}
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await enrollAction(courseSlug);
            toast.success("You're enrolled!");
            router.refresh();
          } catch {
            toast.error("Couldn't enroll — please try again.");
          }
        })
      }
    >
      {isPending ? "Enrolling…" : isFree ? "Enroll for free" : "Enroll with Premium"}
    </Button>
  );
}
