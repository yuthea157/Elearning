"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { recomputeCourseProgress } from "@/lib/services/progress";
import { resolveEnrollmentEligibility } from "@/lib/services/enrollment-eligibility";

export async function enrollAction(courseSlug: string) {
  const { userId } = await verifySession();

  const course = await prisma.course.findFirst({
    where: { slug: courseSlug, status: "PUBLISHED", moderationStatus: "APPROVED" },
    select: { id: true, price: true },
  });
  if (!course) throw new Error("Course not found.");

  const coursePrice = course.price ? Number(course.price) : null;
  const isFree = coursePrice === null || coursePrice <= 0;
  const activeSubscription = isFree ? null : await prisma.subscription.findFirst({ where: { userId, status: "ACTIVE" } });
  const eligibility = resolveEnrollmentEligibility(coursePrice, !!activeSubscription);
  if (!eligibility.allowed) {
    // Not free and no active subscription — the course must go through
    // real checkout (startCourseCheckoutAction in actions/billing.ts),
    // never a silent free enrollment.
    throw new Error("This course requires purchase or a Premium subscription.");
  }
  const source = eligibility.source;

  const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: course.id } } });
  if (!existing) {
    await prisma.$transaction([
      prisma.enrollment.create({ data: { userId, courseId: course.id, source } }),
      prisma.course.update({ where: { id: course.id }, data: { enrollmentCount: { increment: 1 } } }),
    ]);
  }

  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/dashboard");
}

const positionSchema = z.object({ lessonId: z.string().min(1), positionSeconds: z.number().int().min(0) });

/** Called frequently (throttled client-side) while a video plays — cheap,
 * no completion-state recompute, just tracks where to resume from. */
export async function updateVideoPositionAction(input: z.infer<typeof positionSchema>) {
  const { userId } = await verifySession();
  const { lessonId, positionSeconds } = positionSchema.parse(input);

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true, courseId: true } });
  if (!lesson) throw new Error("Lesson not found.");

  const enrolled = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: lesson.courseId } } });
  if (!enrolled) throw new Error("Not enrolled in this course.");

  await prisma.$transaction([
    prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { videoPositionSeconds: positionSeconds, lastAccessedAt: new Date() },
      create: {
        userId,
        lessonId,
        courseId: lesson.courseId,
        status: "IN_PROGRESS",
        videoPositionSeconds: positionSeconds,
      },
    }),
    prisma.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId: lesson.courseId } },
      update: { lastLessonId: lessonId, lastAccessedAt: new Date() },
      create: { userId, courseId: lesson.courseId, lastLessonId: lessonId },
    }),
  ]);
}

export async function markLessonCompleteAction(lessonId: string) {
  const { userId } = await verifySession();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true, course: { select: { slug: true } } },
  });
  if (!lesson) throw new Error("Lesson not found.");

  const enrolled = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: lesson.courseId } } });
  if (!enrolled) throw new Error("Not enrolled in this course.");

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { status: "COMPLETED", completedAt: new Date() },
    create: { userId, lessonId, courseId: lesson.courseId, status: "COMPLETED", completedAt: new Date() },
  });

  const { justCompleted, certificateCode } = await recomputeCourseProgress(userId, lesson.courseId, lessonId);

  revalidatePath(`/learn/${lesson.course.slug}/${lessonId}`);
  revalidatePath("/dashboard");
  return { justCompleted, certificateCode };
}
