import Image from "next/image";
import Link from "next/link";
import { Clock, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/course/rating-stars";
import { formatDuration, formatDifficulty, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

// averageRating/price accept anything stringifiable (including Prisma's
// Decimal) via duck typing, rather than importing the Prisma-generated
// Decimal type into a presentation component's prop type.
export type CourseCardData = {
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  difficulty: string;
  durationMinutes: number;
  averageRating: number | string | { toString(): string };
  reviewCount: number;
  price: number | string | { toString(): string } | null;
  isPremium: boolean;
  instructor: { name: string };
  category: { name: string } | null;
};

export function CourseCard({ course, className }: { course: CourseCardData; className?: string }) {
  const rating = Number(course.averageRating);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="size-8 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
        {course.category && (
          <Badge variant="secondary" className="absolute left-2 top-2 bg-card/90 backdrop-blur-sm">
            {course.category.name}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-heading text-base font-semibold leading-snug text-foreground">{course.title}</h3>
        <p className="text-sm text-muted-foreground">{course.instructor.name}</p>
        {rating > 0 && <RatingStars rating={rating} reviewCount={course.reviewCount} />}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              {formatDuration(course.durationMinutes)}
            </span>
            <span>{formatDifficulty(course.difficulty)}</span>
          </div>
          <span className={cn("text-sm font-semibold", Number(course.price ?? 0) === 0 && "text-success")}>
            {formatPrice(course.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
