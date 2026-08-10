import { describe, it, expect } from "vitest";
import { resolveEnrollmentEligibility } from "@/lib/services/enrollment-eligibility";

describe("resolveEnrollmentEligibility", () => {
  it("allows a free (null price) course regardless of subscription", () => {
    expect(resolveEnrollmentEligibility(null, false)).toEqual({ allowed: true, source: "FREE" });
  });

  it("allows a $0 course regardless of subscription", () => {
    expect(resolveEnrollmentEligibility(0, false)).toEqual({ allowed: true, source: "FREE" });
  });

  it("allows a paid course for a subscriber, sourced as SUBSCRIPTION not FREE", () => {
    expect(resolveEnrollmentEligibility(49, true)).toEqual({ allowed: true, source: "SUBSCRIPTION" });
  });

  it("blocks a paid course for a non-subscriber — must go through checkout", () => {
    expect(resolveEnrollmentEligibility(49, false)).toEqual({ allowed: false });
  });
});
