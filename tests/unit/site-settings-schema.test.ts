import { describe, it, expect } from "vitest";
import { siteSettingsSchema } from "@/lib/schemas/site-settings";

describe("siteSettingsSchema", () => {
  const valid = {
    aboutTitle: "About E-Learning",
    aboutContent: "This is a long enough about-page paragraph to pass validation.",
    footerTagline: "Learn skills that move you forward.",
    footerCopyright: "",
    twitterUrl: "",
    linkedinUrl: "",
    githubUrl: "",
  };

  it("accepts a fully valid submission", () => {
    expect(siteSettingsSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an about title shorter than 2 characters", () => {
    expect(siteSettingsSchema.safeParse({ ...valid, aboutTitle: "A" }).success).toBe(false);
  });

  it("rejects about content under 20 characters", () => {
    expect(siteSettingsSchema.safeParse({ ...valid, aboutContent: "Too short" }).success).toBe(false);
  });

  it("rejects an empty footer tagline", () => {
    expect(siteSettingsSchema.safeParse({ ...valid, footerTagline: "" }).success).toBe(false);
  });

  it("allows all social URLs to be blank (optional)", () => {
    const result = siteSettingsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid social URL", () => {
    expect(siteSettingsSchema.safeParse({ ...valid, twitterUrl: "not a url" }).success).toBe(false);
  });

  it("accepts a valid social URL", () => {
    const result = siteSettingsSchema.safeParse({ ...valid, githubUrl: "https://github.com/example" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.githubUrl).toBe("https://github.com/example");
  });

  it("allows a blank footer copyright override", () => {
    expect(siteSettingsSchema.safeParse({ ...valid, footerCopyright: "" }).success).toBe(true);
  });
});
