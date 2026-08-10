import { randomBytes } from "node:crypto";
import { testDb } from "./db";

// Every fixture created by the integration suite carries this prefix, so
// cleanup can always find (and only find) rows this suite is responsible
// for — never real seed data or another session's manual testing.
export const TEST_PREFIX = "vitest-fixture-";

export function uniqueSuffix() {
  return `${Date.now()}-${randomBytes(3).toString("hex")}`;
}

export async function createTestUser(overrides: { role?: "STUDENT" | "INSTRUCTOR" | "ADMIN"; status?: "ACTIVE" | "SUSPENDED" } = {}) {
  const suffix = uniqueSuffix();
  const username = `${TEST_PREFIX}${suffix}`;
  return testDb.user.create({
    data: {
      email: `${username}@example.com`,
      username,
      name: "Vitest Fixture User",
      // bcrypt hash of "TestPass123" — precomputed so fixture creation
      // doesn't need to import the app's password-hashing module (which
      // pulls in "server-only", not usable outside a Next.js render).
      passwordHash: "$2b$12$hurMY7U/w0QXwP8nS8dQwe2Qjf7m7KKfqj7FyMZyJW1DLiznA6U7a",
      role: overrides.role ?? "STUDENT",
      status: overrides.status ?? "ACTIVE",
      emailVerified: new Date(),
    },
  });
}

export async function createTestCategory() {
  const suffix = uniqueSuffix();
  return testDb.courseCategory.create({
    data: { slug: `${TEST_PREFIX}${suffix}`, name: `Vitest Category ${suffix}` },
  });
}

export async function createTestCourse(instructorId: string, categoryId: string, overrides: Partial<{ price: number | null; lessonCount: number }> = {}) {
  const suffix = uniqueSuffix();
  const course = await testDb.course.create({
    data: {
      slug: `${TEST_PREFIX}${suffix}`,
      title: `Vitest Course ${suffix}`,
      description: "A course created for automated testing.",
      instructorId,
      categoryId,
      price: overrides.price ?? 0,
      isPremium: (overrides.price ?? 0) > 0,
      status: "PUBLISHED",
      moderationStatus: "APPROVED",
    },
  });

  const section = await testDb.courseSection.create({
    data: { courseId: course.id, title: "Section 1", order: 0 },
  });

  const lessonCount = overrides.lessonCount ?? 3;
  const lessons = [];
  for (let i = 0; i < lessonCount; i++) {
    lessons.push(
      await testDb.lesson.create({
        data: { sectionId: section.id, courseId: course.id, title: `Lesson ${i + 1}`, order: i, type: "VIDEO" },
      })
    );
  }

  return { course, section, lessons };
}

/** Deletes every row this suite could have created, in FK-safe order.
 * User deletion cascades most of it away; this exists for the few things
 * that don't cascade from a user (categories, courses whose instructor
 * might be a non-fixture seeded user in a cross-cutting test). */
export async function cleanupTestFixtures() {
  // Courses first — Course.instructorId has no cascade, so a fixture
  // user who authored a course can't be deleted while it still exists.
  await testDb.course.deleteMany({ where: { slug: { startsWith: TEST_PREFIX } } });
  await testDb.user.deleteMany({ where: { username: { startsWith: TEST_PREFIX } } });
  await testDb.courseCategory.deleteMany({ where: { slug: { startsWith: TEST_PREFIX } } });
}
