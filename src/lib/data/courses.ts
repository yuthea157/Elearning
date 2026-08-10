import "server-only";
import { prisma } from "@/lib/prisma";
import type { CourseDifficulty, Prisma } from "@/generated/prisma/client";

export const PUBLISHED_FILTER = { status: "PUBLISHED", moderationStatus: "APPROVED", deletedAt: null } as const;

export const courseCardInclude = {
  instructor: { select: { id: true, name: true, username: true, avatarUrl: true } },
  category: { select: { name: true, slug: true } },
} satisfies Prisma.CourseInclude;

export function getFeaturedCourses(take = 8) {
  return prisma.course.findMany({
    where: { ...PUBLISHED_FILTER, isFeatured: true },
    include: courseCardInclude,
    orderBy: { enrollmentCount: "desc" },
    take,
  });
}

// Small public-facing stats strip for marketing pages (e.g. /about) — only
// counts that are safe to show to an anonymous visitor, unlike the fuller
// admin dashboard stats in lib/data/admin.ts (pending moderation, reports).
export async function getPublicPlatformStats() {
  const [courseCount, instructorCount, studentCount] = await Promise.all([
    prisma.course.count({ where: PUBLISHED_FILTER }),
    prisma.user.count({ where: { role: "INSTRUCTOR", deletedAt: null } }),
    prisma.user.count({ where: { role: "STUDENT", deletedAt: null } }),
  ]);
  return { courseCount, instructorCount, studentCount };
}

export function getTrendingCourses(take = 8) {
  return prisma.course.findMany({
    where: PUBLISHED_FILTER,
    include: courseCardInclude,
    orderBy: [{ enrollmentCount: "desc" }, { averageRating: "desc" }],
    take,
  });
}

export function getPublishedCourseSlugs() {
  return prisma.course.findMany({
    where: PUBLISHED_FILTER,
    select: { slug: true, updatedAt: true },
  });
}

export function getCategories() {
  return prisma.courseCategory.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { courses: true } } },
  });
}

export function getCategoryBySlug(slug: string) {
  return prisma.courseCategory.findUnique({
    where: { slug },
    include: {
      children: { orderBy: { name: "asc" }, include: { _count: { select: { courses: true } } } },
      _count: { select: { courses: true } },
    },
  });
}

export type CourseListFilters = {
  query?: string;
  categorySlug?: string;
  difficulty?: CourseDifficulty;
  priceType?: "free" | "paid";
  sort?: "relevance" | "popular" | "rating" | "newest";
  page?: number;
  pageSize?: number;
};

export async function listCourses(filters: CourseListFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;

  const where: Prisma.CourseWhereInput = {
    ...PUBLISHED_FILTER,
    ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
    ...(filters.priceType === "free" ? { OR: [{ price: null }, { price: 0 }] } : {}),
    ...(filters.priceType === "paid" ? { price: { gt: 0 } } : {}),
    ...(filters.query
      ? {
          OR: [
            { title: { contains: filters.query, mode: "insensitive" } },
            { description: { contains: filters.query, mode: "insensitive" } },
            { instructor: { name: { contains: filters.query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.CourseOrderByWithRelationInput =
    filters.sort === "popular"
      ? { enrollmentCount: "desc" }
      : filters.sort === "rating"
        ? { averageRating: "desc" }
        : filters.sort === "newest"
          ? { publishedAt: "desc" }
          : { enrollmentCount: "desc" };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: courseCardInclude,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.course.count({ where }),
  ]);

  return { courses, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export function getCourseBySlug(slug: string) {
  return prisma.course.findFirst({
    where: { slug, ...PUBLISHED_FILTER },
    include: {
      instructor: { include: { instructorProfile: true } },
      category: true,
      skills: { include: { skill: true } },
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, type: true, durationSeconds: true, isPreview: true },
          },
        },
      },
      reviews: {
        // A single report flags a review for admin attention (REPORTED)
        // without hiding it from the page — only an explicit admin
        // REMOVED action does that. Otherwise reporting would itself be
        // an abuse vector for silencing reviews.
        where: { status: { not: "REMOVED" } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, avatarUrl: true } } },
      },
    },
  });
}
