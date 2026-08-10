import { ArrowUp, ArrowDown, Trash2, PlayCircle, HelpCircle, FileText } from "lucide-react";
import { moveLessonAction, deleteLessonAction } from "@/app/actions/curriculum";
import { QuizQuestionBuilder } from "@/components/instructor/quiz-question-builder";
import { formatDuration } from "@/lib/format";

const TYPE_ICON = { VIDEO: PlayCircle, QUIZ: HelpCircle, ARTICLE: FileText, RESOURCE: FileText };

type Lesson = {
  id: string;
  title: string;
  type: "VIDEO" | "QUIZ" | "ARTICLE" | "RESOURCE";
  durationSeconds: number;
  isPreview: boolean;
  video: { externalId: string | null } | null;
  quiz: { id: string; questions: { id: string; text: string; options: { id: string; text: string; isCorrect: boolean }[] }[] } | null;
};

export function LessonRow({ lesson, isFirst, isLast }: { lesson: Lesson; isFirst: boolean; isLast: boolean }) {
  const Icon = TYPE_ICON[lesson.type];

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center gap-2 p-2.5">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex-1 text-sm text-foreground">{lesson.title}</span>
        {lesson.isPreview && <span className="text-xs font-medium text-primary">Preview</span>}
        {lesson.type === "VIDEO" && !lesson.video?.externalId && (
          <span className="text-xs font-medium text-warning">No video set</span>
        )}
        <span className="text-xs text-muted-foreground">{formatDuration(Math.round(lesson.durationSeconds / 60))}</span>

        <form action={async () => { "use server"; await moveLessonAction(lesson.id, "up"); }}>
          <button type="submit" disabled={isFirst} aria-label="Move lesson up" className="text-muted-foreground hover:text-foreground disabled:opacity-30">
            <ArrowUp className="size-4" />
          </button>
        </form>
        <form action={async () => { "use server"; await moveLessonAction(lesson.id, "down"); }}>
          <button type="submit" disabled={isLast} aria-label="Move lesson down" className="text-muted-foreground hover:text-foreground disabled:opacity-30">
            <ArrowDown className="size-4" />
          </button>
        </form>
        <form action={async () => { "use server"; await deleteLessonAction(lesson.id); }}>
          <button type="submit" aria-label="Delete lesson" className="text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" />
          </button>
        </form>
      </div>

      {lesson.type === "QUIZ" && lesson.quiz && (
        <div className="border-t border-border p-3">
          <QuizQuestionBuilder quizId={lesson.quiz.id} questions={lesson.quiz.questions} />
        </div>
      )}
    </div>
  );
}
