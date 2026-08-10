import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testDb, closeTestDb } from "../helpers/db";
import { createTestUser, createTestCategory, createTestCourse, cleanupTestFixtures } from "../helpers/fixtures";

describe("database constraints (integration)", () => {
  let userId: string;
  let courseId: string;
  let instructorId: string;

  beforeAll(async () => {
    const instructor = await createTestUser({ role: "INSTRUCTOR" });
    const student = await createTestUser({ role: "STUDENT" });
    const category = await createTestCategory();
    const { course } = await createTestCourse(instructor.id, category.id);

    instructorId = instructor.id;
    userId = student.id;
    courseId = course.id;
  });

  afterAll(async () => {
    await cleanupTestFixtures();
    await closeTestDb();
  });

  it("prevents a second review from the same user on the same course (one review per enrollment, editable in place)", async () => {
    await testDb.review.create({ data: { userId, courseId, rating: 5, comment: "Great course" } });
    await expect(testDb.review.create({ data: { userId, courseId, rating: 3, comment: "Second attempt" } })).rejects.toThrow();
  });

  it("prevents double-enrollment in the same course", async () => {
    await testDb.enrollment.create({ data: { userId, courseId, source: "FREE" } });
    await expect(testDb.enrollment.create({ data: { userId, courseId, source: "FREE" } })).rejects.toThrow();
  });

  it("prevents double-bookmarking the same course", async () => {
    await testDb.bookmark.create({ data: { userId, courseId } });
    await expect(testDb.bookmark.create({ data: { userId, courseId } })).rejects.toThrow();
  });

  it("cascades away a user's enrollments, reviews, and bookmarks when the user is deleted", async () => {
    const { course: secondCourse } = await createTestCourse(instructorId, (await createTestCategory()).id);
    const disposableUser = await createTestUser();
    await testDb.enrollment.create({ data: { userId: disposableUser.id, courseId: secondCourse.id, source: "FREE" } });
    await testDb.bookmark.create({ data: { userId: disposableUser.id, courseId: secondCourse.id } });

    await testDb.user.delete({ where: { id: disposableUser.id } });

    const enrollment = await testDb.enrollment.findFirst({ where: { userId: disposableUser.id } });
    const bookmark = await testDb.bookmark.findFirst({ where: { userId: disposableUser.id } });
    expect(enrollment).toBeNull();
    expect(bookmark).toBeNull();
  });

  it("refuses to delete a payment idempotency key twice — the unique constraint that backs webhook idempotency", async () => {
    const order = await testDb.order.create({ data: { userId, courseId, amount: 10, status: "PAID" } });
    const key = `test-idempotency-${order.id}`;
    await testDb.payment.create({
      data: { userId, orderId: order.id, amount: 10, provider: "STRIPE", idempotencyKey: key, status: "SUCCEEDED" },
    });

    const secondOrder = await testDb.order.create({ data: { userId, courseId, amount: 10, status: "PAID" } });
    await expect(
      testDb.payment.create({
        data: { userId, orderId: secondOrder.id, amount: 10, provider: "STRIPE", idempotencyKey: key, status: "SUCCEEDED" },
      })
    ).rejects.toThrow();
  });
});
