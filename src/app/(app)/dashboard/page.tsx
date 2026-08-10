import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Award, PlayCircle, GraduationCap, Trophy } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { getContinueLearning, getSavedCourses, getLearningStats, getRecentAchievements, getCertificates } from "@/lib/data/dashboard";
import { getRecommendedCourses } from "@/lib/services/recommendations";
import { StatTile } from "@/components/dashboard/stat-tile";
import { IconBadge, iconBadgeColorForIndex } from "@/components/ui/icon-badge";
import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { CourseRow } from "@/components/home/course-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your dashboard — E-Learning" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const [continueLearning, saved, stats, achievements, certificates, recommended] = await Promise.all([
    getContinueLearning(user.id),
    getSavedCourses(user.id),
    getLearningStats(user.id),
    getRecentAchievements(user.id),
    getCertificates(user.id),
    getRecommendedCourses(user.id, 4),
  ]);

  const firstName = user.name.split(" ")[0];

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Welcome back, {firstName}</h1>

        <section className="mt-8">
          <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Continue learning</h2>
          {continueLearning.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="Nothing in progress yet"
              description="Enroll in a course to see it here and pick up right where you left off."
              action={
                <Button asChild>
                  <Link href="/courses">Explore courses</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {continueLearning.map((item) => (
                <ContinueLearningCard
                  key={item.id}
                  item={{
                    courseSlug: item.course.slug,
                    courseTitle: item.course.title,
                    thumbnailUrl: item.course.thumbnailUrl,
                    instructorName: item.course.instructor.name,
                    percentComplete: Number(item.percentComplete),
                    lastLessonId: item.lastLessonId,
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Your progress</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile icon={PlayCircle} color="sky" label="Active courses" value={stats.activeEnrollments} />
            <StatTile icon={GraduationCap} color="violet" label="Completed" value={stats.coursesCompleted} />
            <StatTile icon={Award} color="amber" label="Certificates" value={stats.certificatesEarned} />
            <StatTile icon={Trophy} color="emerald" label="Lessons finished" value={stats.lessonsCompleted} />
          </div>
        </section>

        {saved.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold text-foreground">Saved courses</h2>
              <Link href="/saved" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {saved.map(({ course }) => (
                <Link
                  key={course.slug}
                  href={`/courses/${course.slug}`}
                  className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <p className="line-clamp-2 font-medium text-foreground">{course.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{course.instructor.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {certificates.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Certificates</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {certificates.map((cert) => (
                <Link
                  key={cert.id}
                  href={`/certificates/${cert.certificateCode}`}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
                >
                  <IconBadge icon={Award} color="amber" />
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-medium text-foreground">{cert.course.title}</p>
                    <p className="text-xs text-muted-foreground">Issued {new Date(cert.issuedAt).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {achievements.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Achievements</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {achievements.map(({ achievement, earnedAt }, index) => (
                <div
                  key={achievement.id}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-shadow hover:shadow-md"
                >
                  <IconBadge icon={Trophy} color={iconBadgeColorForIndex(index)} size="sm" />
                  <p className="text-sm font-medium text-foreground">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(earnedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <CourseRow title="Recommended for you" description="Based on courses you've saved and enrolled in" courses={recommended} viewAllHref="/courses" />
    </>
  );
}
