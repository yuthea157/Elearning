import { describe, it, expect } from "vitest";
import { scoreCandidateCourse } from "@/lib/services/recommendation-scoring";

describe("scoreCandidateCourse", () => {
  it("scores a category match higher than any number of skill-only matches", () => {
    const categoryOnly = scoreCandidateCourse(
      { categoryId: "design", skillIds: [] },
      { categoryIds: ["design"], skillIds: ["react"] }
    );
    const oneSkillOnly = scoreCandidateCourse(
      { categoryId: "other", skillIds: ["react"] },
      { categoryIds: ["design"], skillIds: ["react"] }
    );
    expect(categoryOnly).toBeGreaterThan(oneSkillOnly);
  });

  it("scores zero when nothing matches", () => {
    const score = scoreCandidateCourse(
      { categoryId: "marketing", skillIds: ["seo"] },
      { categoryIds: ["design"], skillIds: ["react"] }
    );
    expect(score).toBe(0);
  });

  it("scores a category match as exactly 2", () => {
    const score = scoreCandidateCourse({ categoryId: "design", skillIds: [] }, { categoryIds: ["design"], skillIds: [] });
    expect(score).toBe(2);
  });

  it("adds one point per matching skill", () => {
    const score = scoreCandidateCourse(
      { categoryId: "other", skillIds: ["react", "typescript"] },
      { categoryIds: ["design"], skillIds: ["react", "typescript", "sql"] }
    );
    expect(score).toBe(2);
  });

  it("combines category match and skill matches additively", () => {
    const score = scoreCandidateCourse(
      { categoryId: "design", skillIds: ["react"] },
      { categoryIds: ["design"], skillIds: ["react"] }
    );
    expect(score).toBe(3); // 2 for category + 1 for the shared skill
  });

  it("treats a null candidate category as never matching", () => {
    const score = scoreCandidateCourse({ categoryId: null, skillIds: [] }, { categoryIds: ["design"], skillIds: [] });
    expect(score).toBe(0);
  });
});
