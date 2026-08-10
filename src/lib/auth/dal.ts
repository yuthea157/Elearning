import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { decrypt, getSessionCookie } from "./session";
import { findUserById } from "@/lib/data/users";
import type { UserRole } from "@/generated/prisma/client";

/**
 * Centralizes the "is there a valid session, and who is it" check so every
 * Server Component/Action/Route Handler that needs it calls one place
 * instead of re-deriving it — memoized per-request via React's cache().
 */
export const verifySession = cache(async () => {
  const cookie = await getSessionCookie();
  const session = await decrypt(cookie);

  if (!session?.userId) {
    redirect("/login");
  }

  return { isAuth: true, userId: session.userId };
});

/** Same as verifySession but returns null instead of redirecting — for
 * places (public pages) that behave differently for logged-in vs. anonymous
 * visitors without forcing a login. */
export const getOptionalSession = cache(async () => {
  const cookie = await getSessionCookie();
  const session = await decrypt(cookie);
  return session?.userId ? { userId: session.userId } : null;
});

export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  const user = await findUserById(session.userId);
  if (!user) {
    redirect("/api/session/invalidate");
  }
  // Never hand the password hash to a caller that might pass it further
  // down toward a Client Component.
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
});

export const getOptionalCurrentUser = cache(async () => {
  const session = await getOptionalSession();
  if (!session) return null;
  const user = await findUserById(session.userId);
  if (!user) return null;
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
});

/**
 * Authorization on top of verifySession's plain authentication check —
 * throws if the current user's role isn't one of `allowedRoles`. Every
 * mutation reachable by an authenticated-but-unprivileged STUDENT account
 * must call this; verifySession/getCurrentUser alone only prove "is logged
 * in," not "is allowed to do this."
 */
export async function requireRole(...allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("You don't have permission to perform this action.");
  }
  return user;
}

/**
 * Page-level counterpart to requireRole — for a Server Component render,
 * throwing would surface the nearest error boundary, so this redirects to
 * /dashboard instead of the caller's page.
 */
export async function requirePageRole(...allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}
