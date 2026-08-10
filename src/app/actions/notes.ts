"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

const createNoteSchema = z.object({
  lessonId: z.string().min(1),
  courseSlug: z.string().min(1),
  timestampSeconds: z.number().int().min(0),
  text: z.string().trim().min(1, "Note can't be empty.").max(2000),
});

export async function createNoteAction(input: z.infer<typeof createNoteSchema>) {
  const { userId } = await verifySession();
  const { lessonId, courseSlug, timestampSeconds, text } = createNoteSchema.parse(input);

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { courseId: true } });
  if (!lesson) throw new Error("Lesson not found.");

  await prisma.userNote.create({
    data: { userId, lessonId, courseId: lesson.courseId, timestampSeconds, text },
  });

  revalidatePath(`/learn/${courseSlug}/${lessonId}`);
}

export async function deleteNoteAction(noteId: string, courseSlug: string, lessonId: string) {
  const { userId } = await verifySession();
  await prisma.userNote.deleteMany({ where: { id: noteId, userId } });
  revalidatePath(`/learn/${courseSlug}/${lessonId}`);
}
