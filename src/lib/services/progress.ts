import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/services/notifications";
import { calculateProgressPercent, isEligibleForCertificate } from "@/lib/services/progress-calculation";

/**
 * The single place CourseProgress.percentComplete is ever written. Always
 * recomputed from LessonProgress rows — never accepted as a client-supplied
 * number (see docs/ARCHITECTURE.md "Progress integrity"). Called after any
 * event that could change a course's completion state (lesson marked
 * complete, quiz passed).
 *
 * When the recompute crosses 100% for the first time, this also writes the
 * CourseCompletion event and issues a Certificate — both idempotently, so
 * re-running this for an already-completed course is always a no-op there.
 */
export async function recomputeCourseProgress(userId: string, courseId: string, lastLessonId?: string) {
  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({ where: { courseId } }),
    prisma.lessonProgress.count({ where: { userId, courseId, status: "COMPLETED" } }),
  ]);

  const percentComplete = calculateProgressPercent(completedLessons, totalLessons);
  const isNowComplete = isEligibleForCertificate(percentComplete);

  const progress = await prisma.courseProgress.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {
      percentComplete,
      lastAccessedAt: new Date(),
      ...(lastLessonId ? { lastLessonId } : {}),
      ...(isNowComplete ? { completedAt: new Date() } : {}),
    },
    create: {
      userId,
      courseId,
      percentComplete,
      lastLessonId: lastLessonId ?? null,
      completedAt: isNowComplete ? new Date() : null,
    },
  });

  if (!isNowComplete) return { progress, justCompleted: false, certificateCode: undefined };

  const existingCompletion = await prisma.courseCompletion.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (existingCompletion) return { progress, justCompleted: false, certificateCode: undefined };

  const completion = await prisma.courseCompletion.create({ data: { userId, courseId } });
  const certificate = await prisma.certificate.create({
    data: {
      // Not a UUID — deliberately short and URL-friendly for
      // /certificates/[certificateCode], but still 160 bits of entropy,
      // so it's unguessable (brief: "difficult to guess").
      certificateCode: randomBytes(10).toString("base64url"),
      userId,
      courseId,
      completionId: completion.id,
    },
  });

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
  await Promise.all([
    createNotification({
      userId,
      type: "COURSE_COMPLETED",
      title: "Course completed!",
      body: `You've completed "${course?.title ?? "your course"}". Great work.`,
      relatedCourseId: courseId,
    }),
    createNotification({
      userId,
      type: "CERTIFICATE_ISSUED",
      title: "Certificate ready",
      body: `Your certificate for "${course?.title ?? "this course"}" is ready to view and share.`,
      relatedCourseId: courseId,
    }),
  ]);

  return { progress, justCompleted: true, certificateCode: certificate.certificateCode };
}
