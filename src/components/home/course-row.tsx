import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseCard, type CourseCardData } from "@/components/course/course-card";

export function CourseRow({
  title,
  description,
  courses,
  viewAllHref,
}: {
  title: string;
  description?: string;
  courses: CourseCardData[];
  viewAllHref?: string;
}) {
  if (courses.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex">
            View all <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {courses.map((course) => (
          <CourseCard key={course.slug} course={course} />
        ))}
      </div>
    </section>
  );
}
