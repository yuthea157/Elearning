import Link from "next/link";
import { CheckCircle2, PlayCircle, HelpCircle, FileText, Lock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";

type LessonRow = {
  id: string;
  title: string;
  type: "VIDEO" | "QUIZ" | "ARTICLE" | "RESOURCE";
  durationSeconds: number;
  isPreview: boolean;
};

const TYPE_ICON = { VIDEO: PlayCircle, QUIZ: HelpCircle, ARTICLE: FileText, RESOURCE: FileText };

export function CurriculumSidebar({
  courseSlug,
  sections,
  currentLessonId,
  completedLessonIds,
  isEnrolled,
  className,
}: {
  courseSlug: string;
  sections: { id: string; title: string; lessons: LessonRow[] }[];
  currentLessonId: string;
  completedLessonIds: Set<string>;
  isEnrolled: boolean;
  className?: string;
}) {
  return (
    <nav aria-label="Course curriculum" className={cn("flex flex-col gap-4", className)}>
      {sections.map((section) => (
        <div key={section.id}>
          <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</h3>
          <ul className="flex flex-col gap-0.5">
            {section.lessons.map((lesson) => {
              const isCompleted = completedLessonIds.has(lesson.id);
              const isCurrent = lesson.id === currentLessonId;
              const isLocked = !isEnrolled && !lesson.isPreview;
              const Icon = TYPE_ICON[lesson.type];

              const content = (
                <>
                  {isCompleted ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
                  ) : isLocked ? (
                    <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                  <span className="line-clamp-1 flex-1 text-sm">{lesson.title}</span>
                  {lesson.isPreview && !isEnrolled && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                      <Eye className="size-3" aria-hidden="true" /> Preview
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDuration(Math.round(lesson.durationSeconds / 60))}</span>
                </>
              );

              const rowClass = cn(
                "flex items-center gap-2 rounded-md px-2 py-2",
                isCurrent && "bg-primary-subtle",
                isLocked && "pointer-events-none opacity-50"
              );

              return (
                <li key={lesson.id}>
                  {isLocked ? (
                    <div className={rowClass} aria-disabled="true">
                      {content}
                    </div>
                  ) : (
                    <Link href={`/learn/${courseSlug}/${lesson.id}`} className={cn(rowClass, "hover:bg-secondary")} aria-current={isCurrent ? "true" : undefined}>
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
