"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

export async function toggleBookmarkAction(courseId: string, courseSlug: string) {
  const { userId } = await verifySession();

  const existing = await prisma.bookmark.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    await prisma.bookmark.create({ data: { userId, courseId } });
  }

  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/saved");
  revalidatePath("/dashboard");
  return { bookmarked: !existing };
}
