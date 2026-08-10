import { AddSectionForm } from "@/components/instructor/add-section-form";
import { SectionCard } from "@/components/instructor/section-card";

type Section = Parameters<typeof SectionCard>[0]["section"];

export function CurriculumManager({ courseId, sections }: { courseId: string; sections: Section[] }) {
  return (
    <div className="flex flex-col gap-4">
      {sections.map((section, i) => (
        <SectionCard key={section.id} section={section} isFirst={i === 0} isLast={i === sections.length - 1} />
      ))}
      <AddSectionForm courseId={courseId} />
    </div>
  );
}
