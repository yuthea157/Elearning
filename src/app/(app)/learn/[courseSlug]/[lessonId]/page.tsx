import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { verifySession } from "@/lib/auth/dal";
import { getCourseForPlayer, getLessonDetail, isEnrolled, getLessonProgressMap, getCourseProgress, getLessonNotes } from "@/lib/data/learning";
import { CurriculumSidebar } from "@/components/learning/curriculum-sidebar";
import { LessonWorkspace } from "@/components/learning/lesson-workspace";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Learning", robots: { index: false, follow: false } };

export default async function LearnPage({ params }: { params: Promise<{ courseSlug: string; lessonId: string }> }) {
  const { courseSlug, lessonId } = await params;
  const { userId } = await verifySession();

  const course = await getCourseForPlayer(courseSlug);
  if (!course) notFound();

  const allLessons = course.sections.flatMap((s) => s.lessons);
  const currentLesson = allLessons.find((l) => l.id === lessonId);
  if (!currentLesson) notFound();

  const enrolled = await isEnrolled(userId, course.id);
  if (!enrolled && !currentLesson.isPreview) {
    redirect(`/courses/${courseSlug}`);
  }

  const [lessonDetail, progressMap, courseProgress, notes] = await Promise.all([
    getLessonDetail(lessonId),
    enrolled ? getLessonProgressMap(userId, course.id) : Promise.resolve(new Map()),
    enrolled ? getCourseProgress(userId, course.id) : Promise.resolve(null),
    enrolled ? getLessonNotes(userId, lessonId) : Promise.resolve([]),
  ]);
  if (!lessonDetail) notFound();

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const completedLessonIds = new Set([...progressMap.values()].filter((p) => p.status === "COMPLETED").map((p) => p.lessonId));
  const lessonProgress = progressMap.get(lessonId);
  const percentComplete = courseProgress ? Number(courseProgress.percentComplete) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/courses/${courseSlug}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> {course.title}
          </Link>
        </div>
        {enrolled && (
          <div className="flex min-w-[160px] items-center gap-2">
            <Progress value={percentComplete} className="h-1.5 w-32" />
            <span className="shrink-0 text-xs font-medium text-muted-foreground">{Math.round(percentComplete)}% complete</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <LessonWorkspace
            lesson={lessonDetail}
            courseSlug={courseSlug}
            initialPositionSeconds={lessonProgress?.videoPositionSeconds ?? 0}
            notes={notes.map((n) => ({ id: n.id, text: n.text, timestampSeconds: n.timestampSeconds, createdAt: n.createdAt.toISOString() }))}
            isCompleted={completedLessonIds.has(lessonId)}
          />

          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            {previousLesson ? (
              <Button asChild variant="outline">
                <Link href={`/learn/${courseSlug}/${previousLesson.id}`}>
                  <ChevronLeft /> Previous
                </Link>
              </Button>
            ) : (
              <span />
            )}
            {nextLesson ? (
              <Button asChild>
                <Link href={`/learn/${courseSlug}/${nextLesson.id}`}>
                  Next <ChevronRight />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href={`/courses/${courseSlug}`}>Back to course</Link>
              </Button>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:h-fit lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <CurriculumSidebar
            courseSlug={courseSlug}
            sections={course.sections}
            currentLessonId={lessonId}
            completedLessonIds={completedLessonIds}
            isEnrolled={enrolled}
          />
        </aside>
      </div>
    </div>
  );
}
