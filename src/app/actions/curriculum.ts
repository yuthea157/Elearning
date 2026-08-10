"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { createSectionSchema, createLessonSchema } from "@/lib/schemas/course";
import { recomputeCourseDuration } from "@/app/actions/instructor-courses";

async function assertOwnsCourse(courseId: string) {
  const user = await requireRole("INSTRUCTOR", "ADMIN");
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true, slug: true } });
  if (!course) throw new Error("Course not found.");
  if (course.instructorId !== user.id && user.role !== "ADMIN") throw new Error("You don't have permission to edit this course.");
  return course;
}

async function assertOwnsSection(sectionId: string) {
  const section = await prisma.courseSection.findUnique({ where: { id: sectionId }, select: { courseId: true } });
  if (!section) throw new Error("Section not found.");
  await assertOwnsCourse(section.courseId);
  return section;
}

async function assertOwnsLesson(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { courseId: true, sectionId: true } });
  if (!lesson) throw new Error("Lesson not found.");
  await assertOwnsCourse(lesson.courseId);
  return lesson;
}

export type CurriculumFormState = { errors?: Record<string, string[]>; formError?: string } | null;

export async function createSectionAction(_prev: CurriculumFormState, formData: FormData): Promise<CurriculumFormState> {
  const parsed = createSectionSchema.safeParse({ courseId: formData.get("courseId"), title: formData.get("title") });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };

  await assertOwnsCourse(parsed.data.courseId);
  const count = await prisma.courseSection.count({ where: { courseId: parsed.data.courseId } });
  await prisma.courseSection.create({ data: { courseId: parsed.data.courseId, title: parsed.data.title, order: count } });

  revalidatePath(`/instructor/courses/${parsed.data.courseId}/edit`);
  return null;
}

export async function deleteSectionAction(sectionId: string) {
  const section = await assertOwnsSection(sectionId);
  await prisma.courseSection.delete({ where: { id: sectionId } });
  await recomputeCourseDuration(section.courseId);
  revalidatePath(`/instructor/courses/${section.courseId}/edit`);
}

export async function moveSectionAction(sectionId: string, direction: "up" | "down") {
  const section = await assertOwnsSection(sectionId);
  const siblings = await prisma.courseSection.findMany({ where: { courseId: section.courseId }, orderBy: { order: "asc" } });
  const index = siblings.findIndex((s) => s.id === sectionId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= siblings.length) return;

  await prisma.$transaction([
    prisma.courseSection.update({ where: { id: siblings[index].id }, data: { order: siblings[swapWith].order } }),
    prisma.courseSection.update({ where: { id: siblings[swapWith].id }, data: { order: siblings[index].order } }),
  ]);
  revalidatePath(`/instructor/courses/${section.courseId}/edit`);
}

export async function createLessonAction(_prev: CurriculumFormState, formData: FormData): Promise<CurriculumFormState> {
  const parsed = createLessonSchema.safeParse({
    sectionId: formData.get("sectionId"),
    title: formData.get("title"),
    type: formData.get("type"),
    durationMinutes: formData.get("durationMinutes"),
    videoId: formData.get("videoId"),
    isPreview: formData.get("isPreview") === "on",
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };

  const section = await assertOwnsSection(parsed.data.sectionId);
  const count = await prisma.lesson.count({ where: { sectionId: parsed.data.sectionId } });

  const lesson = await prisma.lesson.create({
    data: {
      sectionId: parsed.data.sectionId,
      courseId: section.courseId,
      title: parsed.data.title,
      type: parsed.data.type,
      order: count,
      durationSeconds: parsed.data.durationMinutes * 60,
      isPreview: !!parsed.data.isPreview,
    },
  });

  if (parsed.data.type === "VIDEO" && parsed.data.videoId) {
    await prisma.video.create({
      data: {
        lessonId: lesson.id,
        provider: "YOUTUBE",
        externalId: parsed.data.videoId,
        durationSeconds: parsed.data.durationMinutes * 60,
        status: "READY",
      },
    });
  }
  if (parsed.data.type === "QUIZ") {
    await prisma.quiz.create({ data: { lessonId: lesson.id, title: parsed.data.title, passingScore: 70 } });
  }

  await recomputeCourseDuration(section.courseId);
  revalidatePath(`/instructor/courses/${section.courseId}/edit`);
  return null;
}

export async function deleteLessonAction(lessonId: string) {
  const lesson = await assertOwnsLesson(lessonId);
  await prisma.lesson.delete({ where: { id: lessonId } });
  await recomputeCourseDuration(lesson.courseId);
  revalidatePath(`/instructor/courses/${lesson.courseId}/edit`);
}

export async function moveLessonAction(lessonId: string, direction: "up" | "down") {
  const lesson = await assertOwnsLesson(lessonId);
  const siblings = await prisma.lesson.findMany({ where: { sectionId: lesson.sectionId }, orderBy: { order: "asc" } });
  const index = siblings.findIndex((l) => l.id === lessonId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= siblings.length) return;

  await prisma.$transaction([
    prisma.lesson.update({ where: { id: siblings[index].id }, data: { order: siblings[swapWith].order } }),
    prisma.lesson.update({ where: { id: siblings[swapWith].id }, data: { order: siblings[index].order } }),
  ]);
  revalidatePath(`/instructor/courses/${lesson.courseId}/edit`);
}
