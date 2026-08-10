import "server-only";
import { prisma } from "@/lib/prisma";

export async function getInstructorByUsername(username: string) {
  const instructor = await prisma.user.findFirst({
    where: { username, role: "INSTRUCTOR", deletedAt: null },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      profile: { select: { bio: true } },
      instructorProfile: true,
    },
  });
  if (!instructor) return null;

  const courses = await prisma.course.findMany({
    where: { instructorId: instructor.id, status: "PUBLISHED", moderationStatus: "APPROVED" },
    orderBy: { enrollmentCount: "desc" },
    include: { category: { select: { name: true } } },
  });

  const totalLearners = courses.reduce((sum, c) => sum + c.enrollmentCount, 0);
  const ratedCourses = courses.filter((c) => c.reviewCount > 0);
  const avgRating =
    ratedCourses.length === 0 ? 0 : ratedCourses.reduce((sum, c) => sum + Number(c.averageRating), 0) / ratedCourses.length;

  return {
    instructor,
    courses: courses.map((c) => ({ ...c, instructor: { name: instructor.name } })),
    stats: { courseCount: courses.length, totalLearners, avgRating },
  };
}
