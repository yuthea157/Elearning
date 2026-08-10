import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users, Star, BookOpen, FileEdit } from "lucide-react";
import { requirePageRole } from "@/lib/auth/dal";
import { getInstructorCourses, getInstructorStats } from "@/lib/data/instructor";
import { StatTile } from "@/components/dashboard/stat-tile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Instructor dashboard — E-Learning" };

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: "bg-success/10 text-success",
  DRAFT: "bg-muted text-muted-foreground",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export default async function InstructorDashboardPage() {
  const user = await requirePageRole("INSTRUCTOR", "ADMIN");
  const [courses, stats] = await Promise.all([getInstructorCourses(user.id), getInstructorStats(user.id)]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Instructor dashboard</h1>
        <Button asChild>
          <Link href="/instructor/courses/new">
            <Plus /> New course
          </Link>
        </Button>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile icon={BookOpen} label="Courses" value={stats.totalCourses} />
        <StatTile icon={FileEdit} label="Published" value={stats.publishedCount} />
        <StatTile icon={Users} label="Total learners" value={stats.totalLearners} />
        <StatTile icon={Star} label="Avg. rating" value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"} />
      </div>

      <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Your courses</h2>
      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Create your first course"
          description="Share what you know — start with a title and category, then build out the curriculum."
          action={
            <Button asChild>
              <Link href="/instructor/courses/new">Create your first course</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sections</th>
                <th className="px-4 py-3">Learners</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses.map((course) => (
                <tr key={course.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.category?.name ?? "Uncategorized"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_BADGE[course.status]} variant="secondary">
                      {course.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{course._count.sections}</td>
                  <td className="px-4 py-3 text-muted-foreground">{course.enrollmentCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {course.reviewCount > 0 ? `${Number(course.averageRating).toFixed(1)} (${course._count.reviews})` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/instructor/courses/${course.id}/edit`}>Edit</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
