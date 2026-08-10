import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/schemas/auth";

describe("registerSchema", () => {
  const valid = { name: "Alex Morgan", username: "alex-morgan", email: "alex@example.com", password: "Password123" };

  it("accepts a fully valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password without an uppercase letter", () => {
    const result = registerSchema.safeParse({ ...valid, password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects a password without a number", () => {
    const result = registerSchema.safeParse({ ...valid, password: "Password" });
    expect(result.success).toBe(false);
  });

  it("rejects a password under 8 characters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "Pass1" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a username with uppercase letters", () => {
    const result = registerSchema.safeParse({ ...valid, username: "AlexMorgan" });
    expect(result.success).toBe(false);
  });

  it("rejects a username with spaces or symbols", () => {
    const result = registerSchema.safeParse({ ...valid, username: "alex morgan!" });
    expect(result.success).toBe(false);
  });

  it("accepts a username with hyphens and underscores", () => {
    const result = registerSchema.safeParse({ ...valid, username: "alex_morgan-99" });
    expect(result.success).toBe(true);
  });

  it("rejects a username under 3 characters", () => {
    const result = registerSchema.safeParse({ ...valid, username: "ab" });
    expect(result.success).toBe(false);
  });

  it("trims a name with leading/trailing whitespace rather than rejecting it", () => {
    const result = registerSchema.safeParse({ ...valid, name: "  Alex Morgan  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Alex Morgan");
  });
});

describe("loginSchema", () => {
  it("accepts a valid login", () => {
    expect(loginSchema.safeParse({ email: "a@example.com", password: "anything" }).success).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@example.com", password: "" }).success).toBe(false);
  });

  it("does not enforce password complexity on login (only on registration)", () => {
    // A weak password must still be accepted at the schema level here —
    // login rejects on wrong credentials, not on password shape.
    expect(loginSchema.safeParse({ email: "a@example.com", password: "weak" }).success).toBe(true);
  });
});
