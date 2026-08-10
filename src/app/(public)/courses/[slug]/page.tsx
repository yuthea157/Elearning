import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Clock, Globe, Signal, Users, CheckCircle2, PlayCircle, FileText, HelpCircle } from "lucide-react";
import { getCourseBySlug } from "@/lib/data/courses";
import { getRelatedCourses } from "@/lib/services/recommendations";
import { getOptionalCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { CourseRow } from "@/components/home/course-row";
import { formatDuration, formatDifficulty, formatPrice, formatLearnerCount } from "@/lib/format";
import { RatingStars } from "@/components/course/rating-stars";
import { EnrollButton } from "@/components/course/enroll-button";
import { BookmarkButton } from "@/components/course/bookmark-button";
import { ReportReviewButton } from "@/components/course/report-review-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {};
  return {
    title: course.title,
    description: course.subtitle ?? course.description.slice(0, 160),
    openGraph: { title: course.title, description: course.subtitle ?? undefined, images: course.thumbnailUrl ? [course.thumbnailUrl] : undefined },
  };
}

const LESSON_ICONS = { VIDEO: PlayCircle, QUIZ: HelpCircle, ARTICLE: FileText, RESOURCE: FileText };

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const rating = Number(course.averageRating);
  const firstLessonId = course.sections[0]?.lessons[0]?.id ?? null;
  const isFree = course.price === null || Number(course.price) === 0;

  const user = await getOptionalCurrentUser();
  const [enrollment, bookmark, activeSubscription] = user
    ? await Promise.all([
        prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }),
        prisma.bookmark.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }),
        prisma.subscription.findFirst({ where: { userId: user.id, status: "ACTIVE" } }),
      ])
    : [null, null, null];
  const relatedCourses = await getRelatedCourses(course.id);

  return (
    <div>
      <div className="border-b border-border bg-secondary/30">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="lg:col-span-2">
            {course.category && (
              <Link href={`/categories/${course.category.slug}`} className="text-sm font-medium text-primary hover:underline">
                {course.category.name}
              </Link>
            )}
            <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">{course.title}</h1>
            {course.subtitle && <p className="mt-3 text-lg text-muted-foreground">{course.subtitle}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {rating > 0 && <RatingStars rating={rating} reviewCount={course.reviewCount} size="md" />}
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-4" aria-hidden="true" />
                {formatLearnerCount(course.enrollmentCount)}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-4" aria-hidden="true" />
                {formatDuration(course.durationMinutes)}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Signal className="size-4" aria-hidden="true" />
                {formatDifficulty(course.difficulty)}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="size-4" aria-hidden="true" />
                {course.language.toUpperCase()}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={course.instructor.avatarUrl ?? undefined} alt="" />
                <AvatarFallback>{course.instructor.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Instructor</p>
                <Link href={`/instructors/${course.instructor.username}`} className="font-medium text-foreground hover:underline">
                  {course.instructor.name}
                </Link>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="relative aspect-video w-full bg-muted">
                {course.thumbnailUrl && <Image src={course.thumbnailUrl} alt="" fill className="object-cover" />}
              </div>
              <div className="space-y-3 p-5">
                <p className="font-heading text-2xl font-semibold text-foreground">{formatPrice(course.price)}</p>
                <EnrollButton
                  courseSlug={course.slug}
                  firstLessonId={firstLessonId}
                  isFree={isFree}
                  isEnrolled={!!enrollment}
                  isLoggedIn={!!user}
                  hasActiveSubscription={!!activeSubscription}
                  price={course.price ? Number(course.price) : 0}
                />
                <BookmarkButton
                  courseId={course.id}
                  courseSlug={course.slug}
                  initiallyBookmarked={!!bookmark}
                  isLoggedIn={!!user}
                />
                <p className="text-center text-xs text-muted-foreground">Full lifetime access</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-10 lg:col-span-2">
          {course.learningOutcomes.length > 0 && (
            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">What you&apos;ll learn</h2>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {course.learningOutcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">Course content</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {course.sections.length} sections • {totalLessons} lessons • {formatDuration(course.durationMinutes)}
            </p>
            <Accordion type="single" collapsible className="mt-4" defaultValue={course.sections[0]?.id}>
              {course.sections.map((section) => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger className="text-left font-medium">
                    {section.title}
                    <span className="ml-auto mr-2 text-xs font-normal text-muted-foreground">{section.lessons.length} lessons</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-1">
                      {section.lessons.map((lesson) => {
                        const Icon = LESSON_ICONS[lesson.type];
                        const canOpen = !!enrollment || lesson.isPreview;
                        const row = (
                          <>
                            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <span className="flex-1">{lesson.title}</span>
                            {lesson.isPreview && <span className="text-xs font-medium text-primary">Preview</span>}
                            <span className="text-xs text-muted-foreground">{formatDuration(Math.round(lesson.durationSeconds / 60))}</span>
                          </>
                        );
                        return (
                          <li key={lesson.id}>
                            {canOpen ? (
                              <Link
                                href={`/learn/${course.slug}/${lesson.id}`}
                                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground hover:bg-secondary"
                              >
                                {row}
                              </Link>
                            ) : (
                              <div className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground">{row}</div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {course.requirements.length > 0 && (
            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">Requirements</h2>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-foreground">
                {course.requirements.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground">Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">{course.description}</p>
          </section>

          {course.instructor.instructorProfile && (
            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">About the instructor</h2>
              <div className="mt-4 flex gap-4">
                <Avatar className="size-14">
                  <AvatarImage src={course.instructor.avatarUrl ?? undefined} alt="" />
                  <AvatarFallback>{course.instructor.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <Link href={`/instructors/${course.instructor.username}`} className="font-medium text-foreground hover:underline">
                    {course.instructor.name}
                  </Link>
                  {course.instructor.instructorProfile.title && (
                    <p className="text-sm text-muted-foreground">{course.instructor.instructorProfile.title}</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {course.reviews.length > 0 && (
            <section>
              <h2 className="font-heading text-xl font-semibold text-foreground">Reviews</h2>
              <div className="mt-4 space-y-6">
                {course.reviews.map((review) => (
                  <div key={review.id} className="border-b border-border pb-6 last:border-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={review.user.avatarUrl ?? undefined} alt="" />
                          <AvatarFallback>{review.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{review.user.name}</p>
                          <RatingStars rating={review.rating} />
                        </div>
                      </div>
                      {user && user.id !== review.userId && <ReportReviewButton reviewId={review.id} />}
                    </div>
                    {review.comment && <p className="mt-3 text-sm text-foreground">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <CourseRow title="Related courses" courses={relatedCourses} />
    </div>
  );
}
