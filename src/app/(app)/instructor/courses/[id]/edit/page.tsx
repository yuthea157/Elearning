import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requirePageRole } from "@/lib/auth/dal";
import { getCourseForEdit } from "@/lib/data/instructor";
import { getCategories } from "@/lib/data/courses";
import { CourseMetadataForm } from "@/components/instructor/course-metadata-form";
import { CurriculumManager } from "@/components/instructor/curriculum-manager";
import { PublishToggle } from "@/components/instructor/publish-toggle";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Edit course — E-Learning" };

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageRole("INSTRUCTOR", "ADMIN");

  const [course, categories] = await Promise.all([
    getCourseForEdit(id, user.id, user.role === "ADMIN"),
    getCategories(),
  ]);
  if (!course) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold text-foreground">{course.title}</h1>
            <Badge variant="secondary">{course.status}</Badge>
          </div>
          {course.status === "PUBLISHED" && (
            <Link href={`/courses/${course.slug}`} target="_blank" className="flex items-center gap-1 text-sm text-primary hover:underline">
              View live page <ExternalLink className="size-3" />
            </Link>
          )}
        </div>
        <PublishToggle courseId={course.id} isPublished={course.status === "PUBLISHED"} />
      </div>

      <Tabs defaultValue="curriculum">
        <TabsList>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="details">Course details</TabsTrigger>
        </TabsList>
        <TabsContent value="curriculum" className="pt-6">
          <CurriculumManager courseId={course.id} sections={course.sections} />
        </TabsContent>
        <TabsContent value="details" className="pt-6">
          <CourseMetadataForm
            course={{
              id: course.id,
              title: course.title,
              subtitle: course.subtitle,
              description: course.description,
              categoryId: course.categoryId,
              difficulty: course.difficulty,
              price: course.price ? Number(course.price) : 0,
              thumbnailUrl: course.thumbnailUrl,
              learningOutcomes: course.learningOutcomes,
              requirements: course.requirements,
            }}
            categories={categories}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
