/**
 * Pure progress-math — no Prisma, no I/O — extracted from
 * recomputeCourseProgress (src/lib/services/progress.ts) so it can be unit
 * tested directly against edge cases (0 lessons, 0 completed, exactly
 * 100%) without a database.
 */

/** Rounded to 2 decimal places, matching CourseProgress.percentComplete's
 * @db.Decimal(5, 2) column. A course with zero lessons is 0% complete,
 * not NaN or 100% — there's nothing to have finished. */
export function calculateProgressPercent(completedLessons: number, totalLessons: number): number {
  if (totalLessons <= 0) return 0;
  return Math.round((completedLessons / totalLessons) * 10000) / 100;
}

export function isEligibleForCertificate(percentComplete: number): boolean {
  return percentComplete >= 100;
}
