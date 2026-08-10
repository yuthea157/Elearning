import "server-only";
import { prisma } from "@/lib/prisma";
import { PUBLISHED_FILTER, courseCardInclude, getTrendingCourses } from "@/lib/data/courses";
import { scoreCandidateCourse } from "@/lib/services/recommendation-scoring";

/**
 * Explainable, rule-based recommendations — not machine learning, and this
 * module is the one place that would change if ML recommendations were
 * introduced later (brief section 22: "do not pretend recommendations are
 * AI-generated if they are not"). Signal comes from a user's own
 * enrollments and bookmarks: the categories and skills of courses they've
 * already shown interest in, scored by how many of those a candidate
 * course shares, then broken ties with rating/popularity. Falls back to
 * plain trending courses for a new user with no signal yet, or for
 * anonymous visitors.
 */
export async function getRecommendedCourses(userId: string | null, take = 8) {
  if (!userId) return getTrendingCourses(take);

  const [enrollments, bookmarks] = await Promise.all([
    prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } }),
    prisma.bookmark.findMany({ where: { userId }, select: { courseId: true } }),
  ]);

  const interactedCourseIds = [...new Set([...enrollments.map((e) => e.courseId), ...bookmarks.map((b) => b.courseId)])];
  if (interactedCourseIds.length === 0) return getTrendingCourses(take);

  const interactedCourses = await prisma.course.findMany({
    where: { id: { in: interactedCourseIds } },
    select: { categoryId: true, skills: { select: { skillId: true } } },
  });
  const categoryIds = [...new Set(interactedCourses.map((c) => c.categoryId).filter((id): id is string => !!id))];
  const skillIds = [...new Set(interactedCourses.flatMap((c) => c.skills.map((s) => s.skillId)))];

  if (categoryIds.length === 0 && skillIds.length === 0) return getTrendingCourses(take);

  const candidates = await prisma.course.findMany({
    where: {
      ...PUBLISHED_FILTER,
      id: { notIn: interactedCourseIds },
      OR: [{ categoryId: { in: categoryIds } }, { skills: { some: { skillId: { in: skillIds } } } }],
    },
    include: { ...courseCardInclude, skills: { select: { skillId: true } } },
    take: take * 3, // over-fetch, then rank by relevance below
  });

  const scored = candidates
    .map((course) => ({
      course,
      score: scoreCandidateCourse(
        { categoryId: course.categoryId, skillIds: course.skills.map((s) => s.skillId) },
        { categoryIds, skillIds }
      ),
    }))
    .sort((a, b) => b.score - a.score || Number(b.course.averageRating) - Number(a.course.averageRating));

  // Drop the `skills` field now that scoring is done — getTrendingCourses'
  // filler rows below don't carry it, and callers only need the
  // courseCardInclude shape either way.
  const recommended = scored.slice(0, take).map(({ course }) => {
    const { skills: _skills, ...rest } = course;
    return rest;
  });

  if (recommended.length < take) {
    const fillerNeeded = take - recommended.length;
    const excludeIds = new Set([...interactedCourseIds, ...recommended.map((c) => c.id)]);
    const filler = await getTrendingCourses(fillerNeeded + excludeIds.size);
    for (const course of filler) {
      if (recommended.length >= take) break;
      if (!excludeIds.has(course.id)) recommended.push(course);
    }
  }

  return recommended;
}

/** "Related courses" for a course detail page — same category or shared
 * skills, excluding the course itself. */
export async function getRelatedCourses(courseId: string, take = 4) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { categoryId: true, skills: { select: { skillId: true } } },
  });
  if (!course) return [];

  const skillIds = course.skills.map((s) => s.skillId);

  const candidates = await prisma.course.findMany({
    where: {
      ...PUBLISHED_FILTER,
      id: { not: courseId },
      OR: [
        ...(course.categoryId ? [{ categoryId: course.categoryId }] : []),
        ...(skillIds.length > 0 ? [{ skills: { some: { skillId: { in: skillIds } } } }] : []),
      ],
    },
    include: courseCardInclude,
    orderBy: [{ enrollmentCount: "desc" }],
    take,
  });

  return candidates;
}
