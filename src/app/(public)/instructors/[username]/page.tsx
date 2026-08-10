import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star, Users, BookOpen } from "lucide-react";
import { getInstructorByUsername } from "@/lib/data/instructors";
import { CourseCard } from "@/components/course/course-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatLearnerCount } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const data = await getInstructorByUsername(username);
  if (!data) return {};
  return { title: `${data.instructor.name} — E-Learning instructor` };
}

export default async function InstructorProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getInstructorByUsername(username);
  if (!data) notFound();

  const { instructor, courses, stats } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <Avatar className="size-20">
          <AvatarImage src={instructor.avatarUrl ?? undefined} alt="" />
          <AvatarFallback className="text-xl">{instructor.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">{instructor.name}</h1>
          {instructor.instructorProfile?.title && <p className="mt-1 text-muted-foreground">{instructor.instructorProfile.title}</p>}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-4" aria-hidden="true" /> {stats.courseCount} course{stats.courseCount === 1 ? "" : "s"}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-4" aria-hidden="true" /> {formatLearnerCount(stats.totalLearners)}
            </span>
            {stats.avgRating > 0 && (
              <span className="flex items-center gap-1.5">
                <Star className="size-4 fill-current text-accent-foreground" aria-hidden="true" /> {stats.avgRating.toFixed(1)} average rating
              </span>
            )}
          </div>
        </div>
      </div>

      {instructor.profile?.bio && <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-foreground sm:mx-0 sm:text-left">{instructor.profile.bio}</p>}

      {instructor.instructorProfile?.expertise && instructor.instructorProfile.expertise.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
          {instructor.instructorProfile.expertise.map((skill) => (
            <span key={skill} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {skill}
            </span>
          ))}
        </div>
      )}

      <h2 className="mb-4 mt-10 font-heading text-xl font-semibold text-foreground">Courses by {instructor.name}</h2>
      {courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No published courses yet" description="Check back soon for new courses from this instructor." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
