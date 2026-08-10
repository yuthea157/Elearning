import "server-only";
import { prisma } from "@/lib/prisma";

export async function getContinueLearning(userId: string, take = 4) {
  const progress = await prisma.courseProgress.findMany({
    where: { userId, completedAt: null },
    orderBy: { lastAccessedAt: "desc" },
    take,
    include: {
      course: {
        include: { instructor: { select: { name: true } }, category: { select: { name: true } } },
      },
    },
  });
  return progress;
}

export async function getSavedCourses(userId: string, take = 4) {
  return prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      course: { include: { instructor: { select: { name: true } }, category: { select: { name: true } } } },
    },
  });
}

export async function getLearningStats(userId: string) {
  const [coursesCompleted, certificatesEarned, lessonsCompleted, activeEnrollments] = await Promise.all([
    prisma.courseCompletion.count({ where: { userId } }),
    prisma.certificate.count({ where: { userId } }),
    prisma.lessonProgress.count({ where: { userId, status: "COMPLETED" } }),
    prisma.enrollment.count({ where: { userId, status: "ACTIVE" } }),
  ]);
  return { coursesCompleted, certificatesEarned, lessonsCompleted, activeEnrollments };
}

export async function getCertificates(userId: string, take = 6) {
  return prisma.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    take,
    include: { course: { select: { title: true } } },
  });
}

export async function getRecentAchievements(userId: string, take = 4) {
  return prisma.userAchievement.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
    take,
    include: { achievement: true },
  });
}
