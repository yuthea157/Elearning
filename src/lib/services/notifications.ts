import "server-only";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/client";

const PREFERENCE_FIELD: Partial<Record<NotificationType, "courseCompletionEnabled" | "newCourseEnabled" | "subscriptionEnabled" | "systemEnabled">> = {
  COURSE_COMPLETED: "courseCompletionEnabled",
  CERTIFICATE_ISSUED: "courseCompletionEnabled",
  NEW_COURSE_FROM_INSTRUCTOR: "newCourseEnabled",
  SUBSCRIPTION_EVENT: "subscriptionEnabled",
  SYSTEM: "systemEnabled",
};

/** Respects the user's own NotificationPreference row — a no-op (not an
 * error) if they've turned this category off, or have no preference row
 * yet (defaults to enabled, matching NotificationPreference's own
 * @default(true) on every field). */
export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedCourseId?: string;
}) {
  const prefField = PREFERENCE_FIELD[input.type];
  if (prefField) {
    const prefs = await prisma.notificationPreference.findUnique({ where: { userId: input.userId } });
    if (prefs && !prefs[prefField]) return;
  }

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      relatedCourseId: input.relatedCourseId,
    },
  });
}
