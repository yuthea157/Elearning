"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { logAdminAction } from "@/lib/services/audit";

export async function setCourseFeaturedAction(courseId: string, isFeatured: boolean) {
  const admin = await requireRole("ADMIN");
  await prisma.course.update({ where: { id: courseId }, data: { isFeatured } });
  await logAdminAction(admin.id, isFeatured ? "FEATURE_COURSE" : "UNFEATURE_COURSE", "Course", courseId);
  revalidatePath("/admin/courses");
  revalidatePath("/");
}

export async function setCourseModerationAction(courseId: string, status: "APPROVED" | "REJECTED" | "SUSPENDED") {
  const admin = await requireRole("ADMIN");
  // moderationStatus alone is enough to pull a course from public listings
  // — every discovery/detail query already filters on
  // (status: PUBLISHED, moderationStatus: APPROVED) together.
  const course = await prisma.course.update({
    where: { id: courseId },
    data: { moderationStatus: status },
    select: { slug: true },
  });
  await logAdminAction(admin.id, "MODERATE_COURSE", "Course", courseId, { newStatus: status });
  revalidatePath("/admin/courses");
  revalidatePath(`/courses/${course.slug}`);
}
