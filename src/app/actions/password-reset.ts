"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findUserByEmail } from "@/lib/data/users";
import { hashPassword } from "@/lib/auth/password";
import { sendPasswordResetEmail } from "@/lib/email";
import { enforceRateLimit, formatRetryAfter, getClientIp } from "@/lib/auth/rate-limit";

const requestSchema = z.object({ email: z.email() });

export type RequestResetState = { sent: boolean; formError?: string } | null;

// Always reports success regardless of whether the email exists, to avoid
// leaking which addresses have accounts.
export async function requestPasswordResetAction(_prev: RequestResetState, formData: FormData): Promise<RequestResetState> {
  const ip = await getClientIp();
  const { allowed, retryAfterMs } = enforceRateLimit(`password-reset:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return { sent: false, formError: `Too many reset requests. Try again in ${formatRetryAfter(retryAfterMs)}.` };
  }

  const parsed = requestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { sent: false, formError: "Enter a valid email address." };
  }

  const user = await findUserByEmail(parsed.data.email);
  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password/${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  return { sent: true };
}

const resetSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/[0-9]/, "Password must include a number."),
});

export type ResetPasswordState = { success: boolean; formError?: string } | null;

export async function resetPasswordAction(_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const parsed = resetSchema.safeParse({ token: formData.get("token"), password: formData.get("password") });
  if (!parsed.success) {
    return { success: false, formError: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token: parsed.data.token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { success: false, formError: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return { success: true };
}
