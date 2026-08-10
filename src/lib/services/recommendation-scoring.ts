/**
 * Pure scoring math for getRecommendedCourses (src/lib/services/recommendations.ts)
 * — extracted so the ranking rule itself (category match worth more than a
 * shared skill) can be unit tested without a database.
 */
export function scoreCandidateCourse(
  candidate: { categoryId: string | null; skillIds: string[] },
  target: { categoryIds: string[]; skillIds: string[] }
): number {
  const categoryMatch = candidate.categoryId && target.categoryIds.includes(candidate.categoryId) ? 1 : 0;
  const skillMatches = candidate.skillIds.filter((id) => target.skillIds.includes(id)).length;
  return categoryMatch * 2 + skillMatches;
}
