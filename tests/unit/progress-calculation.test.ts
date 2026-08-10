import { describe, it, expect } from "vitest";
import { calculateProgressPercent, isEligibleForCertificate } from "@/lib/services/progress-calculation";

describe("calculateProgressPercent", () => {
  it("is 0% with no lessons completed", () => {
    expect(calculateProgressPercent(0, 10)).toBe(0);
  });

  it("is 100% when every lesson is completed", () => {
    expect(calculateProgressPercent(10, 10)).toBe(100);
  });

  it("rounds to two decimal places for an uneven fraction", () => {
    // 1 of 3 = 33.333...% -> 33.33
    expect(calculateProgressPercent(1, 3)).toBe(33.33);
  });

  it("is 0%, not NaN or a crash, for a course with zero lessons", () => {
    expect(calculateProgressPercent(0, 0)).toBe(0);
  });

  it("is 0% for a negative total (defensive, shouldn't happen)", () => {
    expect(calculateProgressPercent(0, -1)).toBe(0);
  });
});

describe("isEligibleForCertificate", () => {
  it("is not eligible just under 100%", () => {
    expect(isEligibleForCertificate(99.99)).toBe(false);
  });

  it("is eligible at exactly 100%", () => {
    expect(isEligibleForCertificate(100)).toBe(true);
  });

  it("is eligible above 100% (defensive — shouldn't happen, but must not block)", () => {
    expect(isEligibleForCertificate(100.01)).toBe(true);
  });
});
