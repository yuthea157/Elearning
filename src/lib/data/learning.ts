import "server-only";
import { prisma } from "@/lib/prisma";

/** Course + full curriculum, for the player's sidebar and prev/next nav. */
export function getCourseForPlayer(courseSlug: string) {
  return prisma.course.findFirst({
    where: { slug: courseSlug, status: "PUBLISHED", moderationStatus: "APPROVED" },
    include: {
      instructor: { select: { id: true, name: true } },
      sections: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
}

// isCorrect is deliberately withheld from `options` here — this is what
// renders before a quiz attempt is graded, and shipping the answer key in
// the initial page load would defeat server-side grading entirely (anyone
// could just read it from the page source). It's only ever revealed in
// submitQuizAction's response, after the attempt is scored.
export function getLessonDetail(lessonId: string) {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      video: true,
      transcript: { include: { segments: { orderBy: { order: "asc" } } } },
      quiz: {
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: { options: { orderBy: { order: "asc" }, omit: { isCorrect: true } } },
          },
        },
      },
      resources: true,
    },
  });
}

export function isEnrolled(userId: string, courseId: string) {
  return prisma.enrollment
    .findUnique({ where: { userId_courseId: { userId, courseId } } })
    .then((e) => !!e && e.status === "ACTIVE");
}

export function getLessonProgressMap(userId: string, courseId: string) {
  return prisma.lessonProgress
    .findMany({ where: { userId, courseId } })
    .then((rows) => new Map(rows.map((r) => [r.lessonId, r])));
}

export function getCourseProgress(userId: string, courseId: string) {
  return prisma.courseProgress.findUnique({ where: { userId_courseId: { userId, courseId } } });
}

export function getLessonNotes(userId: string, lessonId: string) {
  return prisma.userNote.findMany({ where: { userId, lessonId }, orderBy: { timestampSeconds: "asc" } });
}

export function getLatestQuizAttempt(userId: string, quizId: string) {
  return prisma.quizAttempt.findFirst({
    where: { userId, quizId, status: "SUBMITTED" },
    orderBy: { submittedAt: "desc" },
  });
}

export function getCertificateForCompletion(userId: string, courseId: string) {
  return prisma.certificate.findFirst({ where: { userId, courseId } });
}
