import "server-only";
import { prisma } from "@/lib/prisma";

export async function getPlatformStats() {
  const [totalUsers, totalInstructors, totalCourses, publishedCourses, totalEnrollments, totalCertificates, pendingModeration, pendingReports] =
    await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { role: "INSTRUCTOR", deletedAt: null } }),
      prisma.course.count({ where: { deletedAt: null } }),
      prisma.course.count({ where: { status: "PUBLISHED", deletedAt: null } }),
      prisma.enrollment.count(),
      prisma.certificate.count(),
      prisma.course.count({ where: { moderationStatus: "PENDING", deletedAt: null } }),
      prisma.report.count({ where: { status: "PENDING" } }),
    ]);

  return { totalUsers, totalInstructors, totalCourses, publishedCourses, totalEnrollments, totalCertificates, pendingModeration, pendingReports };
}

export function getAllUsers(filters?: { role?: string; status?: string; query?: string }) {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(filters?.role ? { role: filters.role as never } : {}),
      ...(filters?.status ? { status: filters.status as never } : {}),
      ...(filters?.query
        ? {
            OR: [
              { name: { contains: filters.query, mode: "insensitive" } },
              { email: { contains: filters.query, mode: "insensitive" } },
              { username: { contains: filters.query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    // Explicit omit rather than relying on every call site to strip
    // passwordHash before this ever reaches a Client Component prop.
    omit: { passwordHash: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export function getAllCoursesForAdmin(filters?: { status?: string; moderationStatus?: string; query?: string }) {
  return prisma.course.findMany({
    where: {
      deletedAt: null,
      ...(filters?.status ? { status: filters.status as never } : {}),
      ...(filters?.moderationStatus ? { moderationStatus: filters.moderationStatus as never } : {}),
      ...(filters?.query ? { title: { contains: filters.query, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { instructor: { select: { name: true } }, category: { select: { name: true } } },
  });
}

export function getAllCategoriesFlat() {
  return prisma.courseCategory.findMany({
    orderBy: { name: "asc" },
    include: { parent: { select: { name: true } }, _count: { select: { courses: true } } },
  });
}

export function getReportedReviews() {
  return prisma.review.findMany({
    where: { status: "REPORTED" },
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { name: true } }, course: { select: { title: true, slug: true } } },
  });
}

export function getReports(status: "PENDING" | "RESOLVED" | "DISMISSED" = "PENDING") {
  return prisma.report.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { name: true } },
      course: { select: { title: true, slug: true } },
      review: { select: { comment: true, rating: true, user: { select: { name: true } } } },
    },
  });
}
