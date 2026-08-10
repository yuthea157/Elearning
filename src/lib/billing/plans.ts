// Kept out of the database — this is a code-level product decision, not
// content an admin edits. If self-serve plan editing is ever needed, this
// is the one place a Stripe Price ID would replace the inline amount.
export const PREMIUM_PLAN = {
  name: "E-Learning Premium",
  amountCents: 2900,
  currency: "usd",
  interval: "month" as const,
};
