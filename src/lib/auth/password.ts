import "server-only";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// A bcrypt hash of an arbitrary, never-used password -- has no corresponding
// real account. Used only to make a "no such user" login attempt pay the
// same bcrypt cost as a real one; see verifyPasswordConstantTime below.
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8Y9m9pR2qKk3bR8f6b6b6b6b6b6b6O";

/**
 * Always performs a real bcrypt compare, even when the account doesn't
 * exist -- without this, a login attempt for an unregistered email returns
 * long before one for a registered email with a wrong password (which pays
 * bcrypt's ~100ms cost), letting an attacker enumerate registered emails
 * purely from response timing.
 */
export async function verifyPasswordConstantTime(password: string, hash: string | undefined) {
  return bcrypt.compare(password, hash ?? DUMMY_HASH);
}
