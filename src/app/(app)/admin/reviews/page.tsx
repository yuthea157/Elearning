import type { Metadata } from "next";
import { Flag } from "lucide-react";
import { getReportedReviews } from "@/lib/data/admin";
import { ReviewModerationActions } from "@/components/admin/review-moderation-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingStars } from "@/components/course/rating-stars";

export const metadata: Metadata = { title: "Moderate reviews — E-Learning admin" };

export default async function AdminReviewsPage() {
  const reviews = await getReportedReviews();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Reported reviews</h2>
      {reviews.length === 0 ? (
        <EmptyState icon={Flag} title="No reported reviews" description="Reviews flagged by users will show up here for moderation." />
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-border p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{review.user.name}</p>
                  <p className="text-xs text-muted-foreground">on {review.course.title}</p>
                </div>
                <RatingStars rating={review.rating} />
              </div>
              {review.comment && <p className="mb-3 text-sm text-foreground">{review.comment}</p>}
              <ReviewModerationActions reviewId={review.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
