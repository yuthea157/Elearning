"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";

export async function markNotificationReadAction(notificationId: string) {
  const { userId } = await verifySession();
  await prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { isRead: true } });
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction() {
  const { userId } = await verifySession();
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  revalidatePath("/notifications");
}

const PREF_FIELDS = ["emailEnabled", "courseCompletionEnabled", "newCourseEnabled", "subscriptionEnabled", "systemEnabled"] as const;
type PrefField = (typeof PREF_FIELDS)[number];

export async function updateNotificationPreferenceAction(field: PrefField, value: boolean) {
  const { userId } = await verifySession();
  if (!PREF_FIELDS.includes(field)) throw new Error("Invalid preference field.");

  await prisma.notificationPreference.upsert({
    where: { userId },
    update: { [field]: value },
    create: { userId, [field]: value },
  });
  revalidatePath("/settings");
}
