import { describe, it, expect } from "vitest";
import { formatDuration, formatPrice, formatLearnerCount, formatDifficulty } from "@/lib/format";

describe("formatDuration", () => {
  it("shows minutes only under an hour", () => {
    expect(formatDuration(45)).toBe("45m");
  });

  it("shows hours with no minutes when exact", () => {
    expect(formatDuration(120)).toBe("2h");
  });

  it("shows hours and minutes together", () => {
    expect(formatDuration(125)).toBe("2h 5m");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("0m");
  });
});

describe("formatPrice", () => {
  it("formats a free course (null price) as Free", () => {
    expect(formatPrice(null)).toBe("Free");
  });

  it("formats zero as Free", () => {
    expect(formatPrice(0)).toBe("Free");
  });

  it("formats a positive number as USD currency", () => {
    expect(formatPrice(49)).toBe("$49.00");
  });

  it("accepts a Decimal-like object via duck typing (toString)", () => {
    const decimalLike = { toString: () => "59.99" };
    expect(formatPrice(decimalLike)).toBe("$59.99");
  });

  it("treats a Decimal-like zero as Free", () => {
    const decimalLike = { toString: () => "0" };
    expect(formatPrice(decimalLike)).toBe("Free");
  });
});

describe("formatLearnerCount", () => {
  it("shows exact count under 1000", () => {
    expect(formatLearnerCount(1)).toBe("1 learner");
    expect(formatLearnerCount(42)).toBe("42 learners");
  });

  it("abbreviates thousands with one decimal under 10k", () => {
    expect(formatLearnerCount(1500)).toBe("1.5k learners");
  });

  it("abbreviates ten-thousands with no decimal", () => {
    expect(formatLearnerCount(12000)).toBe("12k learners");
  });
});

describe("formatDifficulty", () => {
  it("maps known enum values to display labels", () => {
    expect(formatDifficulty("BEGINNER")).toBe("Beginner");
    expect(formatDifficulty("ALL_LEVELS")).toBe("All levels");
  });

  it("falls back to the raw value for an unknown difficulty", () => {
    expect(formatDifficulty("EXPERT")).toBe("EXPERT");
  });
});
