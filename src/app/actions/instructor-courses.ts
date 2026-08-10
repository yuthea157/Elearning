"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { createCourseSchema, updateCourseSchema, slugify } from "@/lib/schemas/course";

async function requireOwnedCourse(courseId: string) {
  const user = await requireRole("INSTRUCTOR", "ADMIN");
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, instructorId: true, slug: true } });
  if (!course) throw new Error("Course not found.");
  if (course.instructorId !== user.id && user.role !== "ADMIN") {
    throw new Error("You don't have permission to edit this course.");
  }
  return { user, course };
}

async function uniqueSlugFor(title: string) {
  const base = slugify(title) || "course";
  let candidate = base;
  let n = 1;
  while (await prisma.course.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${++n}`;
  }
  return candidate;
}

export type CourseFormState = { errors?: Record<string, string[]>; formError?: string } | null;

export async function createCourseAction(_prev: CourseFormState, formData: FormData): Promise<CourseFormState> {
  const user = await requireRole("INSTRUCTOR", "ADMIN");

  const parsed = createCourseSchema.safeParse({
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };

  const slug = await uniqueSlugFor(parsed.data.title);
  const course = await prisma.course.create({
    data: {
      title: parsed.data.title,
      slug,
      description: "",
      categoryId: parsed.data.categoryId,
      instructorId: user.id,
      status: "DRAFT",
      moderationStatus: "PENDING",
    },
  });

  revalidatePath("/instructor");
  redirect(`/instructor/courses/${course.id}/edit`);
}

export async function updateCourseAction(courseId: string, _prev: CourseFormState, formData: FormData): Promise<CourseFormState> {
  const { course } = await requireOwnedCourse(courseId);

  const splitLines = (value: FormDataEntryValue | null) =>
    String(value ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const parsed = updateCourseSchema.safeParse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    difficulty: formData.get("difficulty"),
    price: formData.get("price"),
    thumbnailUrl: formData.get("thumbnailUrl"),
    learningOutcomes: splitLines(formData.get("learningOutcomes")),
    requirements: splitLines(formData.get("requirements")),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };

  await prisma.course.update({
    where: { id: courseId },
    data: {
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      difficulty: parsed.data.difficulty,
      price: parsed.data.price,
      isPremium: parsed.data.price > 0,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
      learningOutcomes: parsed.data.learningOutcomes,
      requirements: parsed.data.requirements,
    },
  });

  revalidatePath(`/instructor/courses/${courseId}/edit`);
  revalidatePath(`/courses/${course.slug}`);
  return null;
}

export async function setCoursePublishedAction(courseId: string, publish: boolean) {
  const { course } = await requireOwnedCourse(courseId);

  if (publish) {
    const full = await prisma.course.findUnique({
      where: { id: courseId },
      include: { sections: { include: { lessons: true } } },
    });
    const lessonCount = full?.sections.reduce((sum, s) => sum + s.lessons.length, 0) ?? 0;
    if (!full?.description || lessonCount === 0) {
      throw new Error("Add a description and at least one lesson before publishing.");
    }
  }

  await prisma.course.update({
    where: { id: courseId },
    data: publish
      ? { status: "PUBLISHED", moderationStatus: "APPROVED", publishedAt: new Date() }
      : { status: "DRAFT" },
  });

  revalidatePath(`/instructor/courses/${courseId}/edit`);
  revalidatePath("/instructor");
  revalidatePath(`/courses/${course.slug}`);
}

export async function recomputeCourseDuration(courseId: string) {
  const lessons = await prisma.lesson.findMany({ where: { courseId }, select: { durationSeconds: true } });
  const durationMinutes = Math.round(lessons.reduce((sum, l) => sum + l.durationSeconds, 0) / 60);
  await prisma.course.update({ where: { id: courseId }, data: { durationMinutes } });
}
