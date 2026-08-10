import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { getSavedCourses } from "@/lib/data/dashboard";
import { CourseCard } from "@/components/course/course-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Saved courses — E-Learning" };

export default async function SavedPage() {
  const user = await getCurrentUser();
  const saved = await getSavedCourses(user.id, 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-semibold text-foreground">Saved courses</h1>

      <div className="mt-8">
        {saved.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No saved courses yet"
            description="Bookmark courses you're interested in to find them here later."
            action={
              <Button asChild>
                <Link href="/courses">Explore courses</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saved.map(({ course }) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
