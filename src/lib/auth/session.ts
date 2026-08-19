import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "elearning_session";
const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error("SESSION_SECRET is not set — add it to .env.local");
}
// Catches an accidental placeholder ("changeme", "secret", ...) rather than
// the real 32-byte value .env.example's own generator produces -- presence
// alone doesn't guarantee it's actually strong.
if (secretKey.length < 32) {
  throw new Error("SESSION_SECRET is too short — generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
}
const encodedKey = new TextEncoder().encode(secretKey);

export type SessionPayload = {
  userId: string;
  expiresAt: number;
};

export async function encrypt(payload: SessionPayload) {
  // The token's own exp claim must match payload.expiresAt, not a fixed
  // "30d" — createSession's rememberDays=1 path (unchecked "Remember me")
  // otherwise still mints a token that verifies successfully for a full 30
  // days if the raw cookie value is ever read by anything other than the
  // browser honoring the cookie's own (correctly short) expiry.
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(payload.expiresAt / 1000))
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * `rememberDays` mirrors the login form's "Remember me" checkbox — unchecked
 * still gets a session, just a much shorter-lived one, rather than a true
 * browser-session cookie (which the httpOnly/secure setup here doesn't
 * change the security of either way).
 */
export async function createSession(userId: string, rememberDays = 30) {
  const expiresAt = new Date(Date.now() + rememberDays * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, expiresAt: expiresAt.getTime() });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
