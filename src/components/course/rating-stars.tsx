import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  reviewCount,
  size = "sm",
  className,
}: {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const starSize = size === "md" ? "size-4" : "size-3.5";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
      <div className="flex items-center" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.round(rating);
          return (
            <Star
              key={i}
              className={cn(starSize, filled ? "fill-accent-foreground text-accent-foreground" : "fill-none text-muted-foreground/40")}
            />
          );
        })}
      </div>
      {reviewCount !== undefined && <span className="text-sm text-muted-foreground">({reviewCount.toLocaleString()})</span>}
      <span className="sr-only">
        {rating.toFixed(1)} out of 5 stars{reviewCount !== undefined ? `, ${reviewCount} reviews` : ""}
      </span>
    </div>
  );
}
