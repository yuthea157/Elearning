"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { logAdminAction } from "@/lib/services/audit";

export async function moderateReviewAction(reviewId: string, status: "APPROVED" | "REMOVED") {
  const admin = await requireRole("ADMIN");
  const review = await prisma.review.update({ where: { id: reviewId }, data: { status }, select: { courseId: true } });
  await logAdminAction(admin.id, "MODERATE_REVIEW", "Review", reviewId, { newStatus: status });

  if (status === "REMOVED") {
    await recomputeCourseRating(review.courseId);
  }

  revalidatePath("/admin/reviews");
}

export async function resolveReportAction(reportId: string, status: "RESOLVED" | "DISMISSED") {
  const admin = await requireRole("ADMIN");
  await prisma.report.update({ where: { id: reportId }, data: { status, resolvedAt: new Date() } });
  await logAdminAction(admin.id, "RESOLVE_REPORT", "Report", reportId, { newStatus: status });
  revalidatePath("/admin/reports");
}

async function recomputeCourseRating(courseId: string) {
  const approved = await prisma.review.findMany({ where: { courseId, status: "APPROVED" }, select: { rating: true } });
  const reviewCount = approved.length;
  const averageRating = reviewCount === 0 ? 0 : approved.reduce((sum, r) => sum + r.rating, 0) / reviewCount;
  await prisma.course.update({ where: { id: courseId }, data: { reviewCount, averageRating } });
}
