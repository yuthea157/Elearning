"use server";

import { redirect } from "next/navigation";
import { registerSchema, loginSchema } from "@/lib/schemas/auth";
import { createUser, findUserByEmail, findUserByUsername } from "@/lib/data/users";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";
import { enforceRateLimit, formatRetryAfter, getClientIp } from "@/lib/auth/rate-limit";

export type AuthFormState = {
  errors?: Record<string, string[]>;
  formError?: string;
} | null;

export async function registerAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const ip = await getClientIp();
  const { allowed, retryAfterMs } = enforceRateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return { formError: `Too many accounts created from this network. Try again in ${formatRetryAfter(retryAfterMs)}.` };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { name, username, email, password } = parsed.data;

  const [existingEmail, existingUsername] = await Promise.all([
    findUserByEmail(email),
    findUserByUsername(username),
  ]);
  if (existingEmail) {
    return { errors: { email: ["An account with this email already exists."] } };
  }
  if (existingUsername) {
    return { errors: { username: ["That username is taken."] } };
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ name, username, email, passwordHash });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const ip = await getClientIp();
  const { allowed, retryAfterMs } = enforceRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!allowed) {
    return { formError: `Too many login attempts. Try again in ${formatRetryAfter(retryAfterMs)}.` };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember") === "on",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { email, password, remember } = parsed.data;
  const user = await findUserByEmail(email);
  if (!user) {
    return { formError: "Incorrect email or password." };
  }
  if (user.status === "SUSPENDED") {
    return { formError: "This account has been suspended. Contact support for help." };
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    return { formError: "Incorrect email or password." };
  }

  await createSession(user.id, remember ? 30 : 1);
  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
