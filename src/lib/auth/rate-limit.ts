import "server-only";
import { headers } from "next/headers";

/**
 * In-memory fixed-window rate limiter — a stopgap against credential
 * stuffing / registration spam / password-reset abuse for a single-instance
 * deployment. Resets on redeploy and doesn't share state across instances,
 * so swap for a distributed store (e.g. Upstash Redis) before scaling
 * horizontally — see docs/ARCHITECTURE.md "Production hardening".
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

// Unbounded growth guard: buckets are small (a few dozen bytes) and expire
// on their own, but a sustained attack from many IPs would still grow this
// map forever without an upper bound.
const MAX_TRACKED_KEYS = 50_000;

export async function getClientIp() {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

// Not gated inside checkRateLimit itself so the limiter logic stays a pure,
// directly-unit-testable function — the environment gate lives here instead.
// Skipped outside production so local dev and the e2e suite (which log in
// and register repeatedly from the same machine, well past any threshold
// that's still meaningful for stopping real credential stuffing) aren't
// throttled by it.
export function enforceRateLimit(key: string, max: number, windowMs: number): { allowed: boolean; retryAfterMs: number } {
  if (process.env.NODE_ENV !== "production") return { allowed: true, retryAfterMs: 0 };
  return checkRateLimit(key, max, windowMs);
}

export function checkRateLimit(key: string, max: number, windowMs: number): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= max) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

export function formatRetryAfter(retryAfterMs: number) {
  const minutes = Math.ceil(retryAfterMs / 60_000);
  return minutes <= 1 ? "a minute" : `${minutes} minutes`;
}
