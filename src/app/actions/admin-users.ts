"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { logAdminAction } from "@/lib/services/audit";
import { editUserSchema } from "@/lib/schemas/auth";

export async function setUserStatusAction(userId: string, status: "ACTIVE" | "SUSPENDED") {
  const admin = await requireRole("ADMIN");
  if (userId === admin.id) throw new Error("You can't change your own account status.");

  await prisma.user.update({ where: { id: userId }, data: { status } });
  await logAdminAction(admin.id, status === "SUSPENDED" ? "SUSPEND_USER" : "REACTIVATE_USER", "User", userId);

  revalidatePath("/admin/users");
}

export type EditUserFormState = { errors?: Record<string, string[]>; formError?: string; success?: boolean } | null;

export async function updateUserAction(userId: string, _prev: EditUserFormState, formData: FormData): Promise<EditUserFormState> {
  const admin = await requireRole("ADMIN");

  const parsed = editUserSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };

  const { name, username, email, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  if (userId === admin.id && role !== "ADMIN") {
    return { errors: { role: ["You can't remove your own admin access."] } };
  }

  const [emailConflict, usernameConflict] = await Promise.all([
    prisma.user.findFirst({ where: { email: normalizedEmail, NOT: { id: userId } }, select: { id: true } }),
    prisma.user.findFirst({ where: { username, NOT: { id: userId } }, select: { id: true } }),
  ]);
  if (emailConflict) return { errors: { email: ["Another account already uses this email."] } };
  if (usernameConflict) return { errors: { username: ["That username is taken."] } };

  await prisma.user.update({ where: { id: userId }, data: { name, username, email: normalizedEmail, role } });
  await logAdminAction(admin.id, "UPDATE_USER", "User", userId, { name, username, email: normalizedEmail, role });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUserAction(userId: string) {
  const admin = await requireRole("ADMIN");
  if (userId === admin.id) throw new Error("You can't delete your own account.");

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, deletedAt: true } });
  if (!target || target.deletedAt) throw new Error("User not found.");

  if (target.role === "INSTRUCTOR") {
    const activeCourseCount = await prisma.course.count({ where: { instructorId: userId, deletedAt: null } });
    if (activeCourseCount > 0) {
      throw new Error(`Can't delete — this instructor still has ${activeCourseCount} course(s). Reassign or delete those first.`);
    }
  }

  // Soft delete: preserves the row so past enrollments, reviews, payments,
  // and issued certificates keep pointing to a real user, but the account
  // drops out of every `deletedAt: null`-filtered list and can never log in
  // again (status: SUSPENDED is independently enforced at login).
  await prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date(), status: "SUSPENDED" } });
  await logAdminAction(admin.id, "DELETE_USER", "User", userId);

  revalidatePath("/admin/users");
}
