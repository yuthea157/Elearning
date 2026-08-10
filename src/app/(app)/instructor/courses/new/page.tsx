import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth/dal";
import { getCategories } from "@/lib/data/courses";
import { NewCourseForm } from "@/components/instructor/new-course-form";

export const metadata: Metadata = { title: "Create a course — E-Learning" };

export default async function NewCoursePage() {
  await requirePageRole("INSTRUCTOR", "ADMIN");
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-1 font-heading text-2xl font-semibold text-foreground">Create a course</h1>
      <p className="mb-6 text-sm text-muted-foreground">Start with the basics — you&apos;ll build out the curriculum next.</p>
      <NewCourseForm categories={categories} />
    </div>
  );
}
