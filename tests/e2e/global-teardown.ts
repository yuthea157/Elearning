import { config } from "dotenv";
config({ path: ".env.local" });
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";

// Every e2e spec creates users/courses prefixed "e2e-" — cleaned up here
// rather than per-spec, since Playwright specs don't share the
// afterAll-per-file discipline the integration suite uses, and a couple
// of specs (instructor-workflow, admin-workflow) intentionally touch
// shared seed data that must be restored, not deleted.
export default async function globalTeardown() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const testUsers = await prisma.user.findMany({
    where: { username: { startsWith: "e2e-" } },
    select: { id: true },
  });
  const userIds = testUsers.map((u) => u.id);

  const enrollments = await prisma.enrollment.findMany({ where: { userId: { in: userIds } }, select: { courseId: true } });
  const perCourseCount = new Map<string, number>();
  for (const e of enrollments) perCourseCount.set(e.courseId, (perCourseCount.get(e.courseId) ?? 0) + 1);
  for (const [courseId, count] of perCourseCount) {
    await prisma.course.update({ where: { id: courseId }, data: { enrollmentCount: { decrement: count } } }).catch(() => {});
  }

  await prisma.course.deleteMany({ where: { title: { startsWith: "E2E Instructor Course" } } });
  const deletedUsers = await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  console.log(`[e2e teardown] removed ${deletedUsers.count} test user(s) and their fixtures.`);

  await prisma.$disconnect();
  await pool.end();
}
