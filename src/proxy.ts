import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth/session";

const AUTH_ONLY_ROUTES = ["/login", "/register", "/forgot-password"];
const PROTECTED_PREFIXES = ["/dashboard", "/learn", "/instructor", "/admin", "/saved", "/settings", "/notifications"];

// Optimistic check only — reads the session cookie, does not touch the
// database. Real authorization (including role checks for /instructor and
// /admin) still happens in the DAL (requireRole/requirePageRole) closer to
// the data; this just keeps unauthenticated users from ever seeing
// protected pages render, and bounces logged-in users off the auth pages.
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const cookie = req.cookies.get("elearning_session")?.value;
  const session = await decrypt(cookie);
  const isAuthed = Boolean(session?.userId);

  const isProtected = PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  const isAuthOnly = AUTH_ONLY_ROUTES.includes(path);

  if (isProtected && !isAuthed) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnly && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)"],
};
