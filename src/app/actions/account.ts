"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logAdminAction } from "@/lib/services/audit";
import { editOwnProfileSchema, changePasswordSchema } from "@/lib/schemas/auth";

export type EditProfileState = { errors?: Record<string, string[]>; formError?: string; success?: boolean } | null;

// Deliberately scoped to the currently-authenticated admin editing their
// own account, not a generic "edit any user" action — that one already
// exists (updateUserAction in admin-users.ts) and is reachable from
// /admin/users. This is the self-service counterpart surfaced directly in
// the admin dashboard, so an admin doesn't have to find themselves in the
// full user list just to fix a typo in their own name.
export async function updateOwnProfileAction(_prev: EditProfileState, formData: FormData): Promise<EditProfileState> {
  const admin = await requireRole("ADMIN");

  const parsed = editOwnProfileSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };

  const { name, username, email } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const [emailConflict, usernameConflict] = await Promise.all([
    prisma.user.findFirst({ where: { email: normalizedEmail, NOT: { id: admin.id } }, select: { id: true } }),
    prisma.user.findFirst({ where: { username, NOT: { id: admin.id } }, select: { id: true } }),
  ]);
  if (emailConflict) return { errors: { email: ["Another account already uses this email."] } };
  if (usernameConflict) return { errors: { username: ["That username is taken."] } };

  await prisma.user.update({ where: { id: admin.id }, data: { name, username, email: normalizedEmail } });
  await logAdminAction(admin.id, "UPDATE_OWN_PROFILE", "User", admin.id);

  revalidatePath("/admin/settings");
  return { success: true };
}

export type ChangePasswordState = { errors?: Record<string, string[]>; formError?: string; success?: boolean } | null;

export async function changeOwnPasswordAction(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const admin = await requireRole("ADMIN");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };

  const current = await prisma.user.findUnique({ where: { id: admin.id }, select: { passwordHash: true } });
  if (!current) return { formError: "Account not found." };

  const currentPasswordMatches = await verifyPassword(parsed.data.currentPassword, current.passwordHash);
  if (!currentPasswordMatches) {
    return { errors: { currentPassword: ["That's not your current password."] } };
  }

  const newPasswordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: admin.id }, data: { passwordHash: newPasswordHash } });
  await logAdminAction(admin.id, "CHANGE_OWN_PASSWORD", "User", admin.id);

  return { success: true };
}
