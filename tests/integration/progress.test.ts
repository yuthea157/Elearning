import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testDb, closeTestDb } from "../helpers/db";
import { createTestUser, createTestCategory, createTestCourse, cleanupTestFixtures } from "../helpers/fixtures";
import { recomputeCourseProgress } from "@/lib/services/progress";

describe("recomputeCourseProgress (integration)", () => {
  let userId: string;
  let courseId: string;
  let lessonIds: string[];

  beforeAll(async () => {
    const instructor = await createTestUser({ role: "INSTRUCTOR" });
    const student = await createTestUser({ role: "STUDENT" });
    const category = await createTestCategory();
    const { course, lessons } = await createTestCourse(instructor.id, category.id, { lessonCount: 3 });

    userId = student.id;
    courseId = course.id;
    lessonIds = lessons.map((l) => l.id);

    await testDb.enrollment.create({ data: { userId, courseId, source: "FREE" } });
  });

  afterAll(async () => {
    await cleanupTestFixtures();
    await closeTestDb();
  });

  it("is 0% before any lesson is completed", async () => {
    const { progress, justCompleted } = await recomputeCourseProgress(userId, courseId);
    expect(Number(progress.percentComplete)).toBe(0);
    expect(justCompleted).toBe(false);
  });

  it("computes a partial percentage as lessons complete one at a time", async () => {
    await testDb.lessonProgress.create({
      data: { userId, lessonId: lessonIds[0], courseId, status: "COMPLETED", completedAt: new Date() },
    });

    const { progress, justCompleted } = await recomputeCourseProgress(userId, courseId);
    expect(Number(progress.percentComplete)).toBeCloseTo(33.33, 1);
    expect(justCompleted).toBe(false);
  });

  it("marks the course complete and issues a certificate at 100%, and not before", async () => {
    await testDb.lessonProgress.create({
      data: { userId, lessonId: lessonIds[1], courseId, status: "COMPLETED", completedAt: new Date() },
    });
    const midway = await recomputeCourseProgress(userId, courseId);
    expect(midway.justCompleted).toBe(false);
    expect(midway.certificateCode).toBeUndefined();

    await testDb.lessonProgress.create({
      data: { userId, lessonId: lessonIds[2], courseId, status: "COMPLETED", completedAt: new Date() },
    });
    const final = await recomputeCourseProgress(userId, courseId);

    expect(Number(final.progress.percentComplete)).toBe(100);
    expect(final.justCompleted).toBe(true);
    expect(final.certificateCode).toBeTruthy();
    // Short but high-entropy per docs/DATABASE.md — not a sequential or guessable id.
    expect(final.certificateCode!.length).toBeGreaterThanOrEqual(10);

    const completion = await testDb.courseCompletion.findUnique({ where: { userId_courseId: { userId, courseId } } });
    expect(completion).not.toBeNull();
    const certificate = await testDb.certificate.findUnique({ where: { certificateCode: final.certificateCode! } });
    expect(certificate?.courseId).toBe(courseId);
  });

  it("is idempotent — recomputing an already-completed course does not create a second completion or certificate", async () => {
    const before = await testDb.certificate.count({ where: { userId, courseId } });
    const result = await recomputeCourseProgress(userId, courseId);

    expect(result.justCompleted).toBe(false);
    expect(result.certificateCode).toBeUndefined();
    const after = await testDb.certificate.count({ where: { userId, courseId } });
    expect(after).toBe(before);
  });

  it("wrote exactly one COURSE_COMPLETED and one CERTIFICATE_ISSUED notification, not one per recompute call", async () => {
    const notifications = await testDb.notification.findMany({ where: { userId, relatedCourseId: courseId } });
    const types = notifications.map((n) => n.type).sort();
    expect(types).toEqual(["CERTIFICATE_ISSUED", "COURSE_COMPLETED"]);
  });
});
