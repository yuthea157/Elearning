import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { moveSectionAction, deleteSectionAction } from "@/app/actions/curriculum";
import { AddLessonForm } from "@/components/instructor/add-lesson-form";
import { LessonRow } from "@/components/instructor/lesson-row";

type Section = {
  id: string;
  title: string;
  lessons: Parameters<typeof LessonRow>[0]["lesson"][];
};

export function SectionCard({ section, isFirst, isLast }: { section: Section; isFirst: boolean; isLast: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="flex-1 font-medium text-foreground">{section.title}</h3>
        <form action={async () => { "use server"; await moveSectionAction(section.id, "up"); }}>
          <button type="submit" disabled={isFirst} aria-label="Move section up" className="text-muted-foreground hover:text-foreground disabled:opacity-30">
            <ArrowUp className="size-4" />
          </button>
        </form>
        <form action={async () => { "use server"; await moveSectionAction(section.id, "down"); }}>
          <button type="submit" disabled={isLast} aria-label="Move section down" className="text-muted-foreground hover:text-foreground disabled:opacity-30">
            <ArrowDown className="size-4" />
          </button>
        </form>
        <form action={async () => { "use server"; await deleteSectionAction(section.id); }}>
          <button type="submit" aria-label="Delete section" className="text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" />
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-2">
        {section.lessons.map((lesson, i) => (
          <LessonRow key={lesson.id} lesson={lesson} isFirst={i === 0} isLast={i === section.lessons.length - 1} />
        ))}
      </div>

      <div className="mt-3">
        <AddLessonForm sectionId={section.id} />
      </div>
    </div>
  );
}
