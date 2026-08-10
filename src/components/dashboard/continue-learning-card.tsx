import Image from "next/image";
import Link from "next/link";
import { BookOpen, PlayCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export type ContinueLearningData = {
  courseSlug: string;
  courseTitle: string;
  thumbnailUrl: string | null;
  instructorName: string;
  percentComplete: number;
  lastLessonId: string | null;
};

export function ContinueLearningCard({ item }: { item: ContinueLearningData }) {
  const href = item.lastLessonId ? `/learn/${item.courseSlug}/${item.lastLessonId}` : `/courses/${item.courseSlug}`;

  return (
    <Link
      href={href}
      className="group flex gap-4 rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-40">
        {item.thumbnailUrl ? (
          <Image src={item.thumbnailUrl} alt="" fill sizes="160px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="size-6 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/20">
          <PlayCircle className="size-8 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <h3 className="line-clamp-1 font-medium text-foreground">{item.courseTitle}</h3>
        <p className="text-sm text-muted-foreground">{item.instructorName}</p>
        <div className="mt-1 flex items-center gap-2">
          <Progress value={item.percentComplete} className="h-1.5" />
          <span className="shrink-0 text-xs font-medium text-muted-foreground">{Math.round(item.percentComplete)}%</span>
        </div>
      </div>
    </Link>
  );
}
