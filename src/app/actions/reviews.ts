"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

const reportReviewSchema = z.object({
  reviewId: z.string().min(1),
  reason: z.string().trim().min(3, "Say a bit more about why you're reporting this.").max(500),
});

export async function reportReviewAction(input: z.infer<typeof reportReviewSchema>) {
  const { userId } = await verifySession();
  const { reviewId, reason } = reportReviewSchema.parse(input);

  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { courseId: true, userId: true } });
  if (!review) throw new Error("Review not found.");
  if (review.userId === userId) throw new Error("You can't report your own review.");

  await prisma.$transaction([
    prisma.report.create({ data: { reporterUserId: userId, targetType: "REVIEW", reviewId, reason } }),
    prisma.review.update({ where: { id: reviewId }, data: { status: "REPORTED" } }),
  ]);

  const course = await prisma.course.findUnique({ where: { id: review.courseId }, select: { slug: true } });
  if (course) revalidatePath(`/courses/${course.slug}`);
}
