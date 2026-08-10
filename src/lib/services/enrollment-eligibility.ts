/**
 * Pure eligibility rule for enrollAction (src/app/actions/learning.ts) — no
 * Prisma, no I/O. A course only enrolls without going through checkout
 * (startCourseCheckoutAction) if it's free, or the user already holds an
 * active Premium subscription.
 */
export type EnrollmentEligibility = { allowed: true; source: "FREE" | "SUBSCRIPTION" } | { allowed: false };

export function resolveEnrollmentEligibility(coursePrice: number | null, hasActiveSubscription: boolean): EnrollmentEligibility {
  const isFree = coursePrice === null || coursePrice <= 0;
  if (isFree) return { allowed: true, source: "FREE" };
  if (hasActiveSubscription) return { allowed: true, source: "SUBSCRIPTION" };
  return { allowed: false };
}
