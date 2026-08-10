import "server-only";
import { prisma } from "@/lib/prisma";

export function getInstructorCourses(instructorId: string) {
  return prisma.course.findMany({
    where: { instructorId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      category: { select: { name: true } },
      _count: { select: { sections: true, reviews: true } },
    },
  });
}

export async function getInstructorStats(instructorId: string) {
  const courses = await prisma.course.findMany({
    where: { instructorId, deletedAt: null },
    select: { enrollmentCount: true, averageRating: true, reviewCount: true, status: true },
  });
  const published = courses.filter((c) => c.status === "PUBLISHED");
  const totalLearners = courses.reduce((sum, c) => sum + c.enrollmentCount, 0);
  const avgRating =
    published.length === 0
      ? 0
      : published.reduce((sum, c) => sum + Number(c.averageRating), 0) / published.length;

  return {
    totalCourses: courses.length,
    publishedCount: published.length,
    draftCount: courses.length - published.length,
    totalLearners,
    avgRating,
  };
}

export function getCourseForEdit(courseId: string, instructorId: string, isAdmin = false) {
  return prisma.course.findFirst({
    where: isAdmin ? { id: courseId } : { id: courseId, instructorId },
    include: {
      category: true,
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { video: true, quiz: { include: { questions: { include: { options: true }, orderBy: { order: "asc" } } } } },
          },
        },
      },
    },
  });
}
