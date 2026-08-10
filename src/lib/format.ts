export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

// Accepts anything stringifiable (including Prisma's Decimal) via duck
// typing, rather than importing the Prisma-generated Decimal type into a
// plain presentation utility.
export function formatPrice(price: number | string | { toString(): string } | null | undefined) {
  const value = price === null || price === undefined ? 0 : Number(price.toString());
  if (value === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function formatLearnerCount(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k learners`;
  return `${count} learner${count === 1 ? "" : "s"}`;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  ALL_LEVELS: "All levels",
};

export function formatDifficulty(difficulty: string) {
  return DIFFICULTY_LABELS[difficulty] ?? difficulty;
}
