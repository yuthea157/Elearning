import type { Metadata } from "next";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { CourseRowActions } from "@/components/admin/course-row-actions";
import { getAllCoursesForAdmin } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Manage courses — E-Learning admin" };

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<{ moderationStatus?: string }> }) {
  const { moderationStatus } = await searchParams;
  const courses = await getAllCoursesForAdmin({ moderationStatus });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold text-foreground">Courses</h2>
        <p className="text-sm text-muted-foreground">{courses.length} shown</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Learners</th>
              <th className="px-4 py-3">Moderation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="px-4 py-3">
                  {course.status === "PUBLISHED" ? (
                    <Link href={`/courses/${course.slug}`} target="_blank" className="font-medium text-foreground hover:underline">
                      {course.title}
                    </Link>
                  ) : (
                    <p className="font-medium text-foreground">{course.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {course.instructor.name} · {course.category?.name ?? "Uncategorized"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{course.status}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{course.enrollmentCount}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/instructor/courses/${course.id}/edit`}
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      <Pencil className="size-3.5" /> Edit
                    </Link>
                    <CourseRowActions courseId={course.id} isFeatured={course.isFeatured} moderationStatus={course.moderationStatus} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
