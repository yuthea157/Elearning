import { describe, it, expect } from "vitest";
import { createCourseSchema, updateCourseSchema, createLessonSchema, slugify } from "@/lib/schemas/course";

describe("slugify", () => {
  it("lowercases and hyphenates a title", () => {
    expect(slugify("Intro to Product Analytics")).toBe("intro-to-product-analytics");
  });

  it("strips punctuation", () => {
    expect(slugify("React & TypeScript: The Full Guide!")).toBe("react-typescript-the-full-guide");
  });

  it("trims leading/trailing hyphens produced by punctuation at the edges", () => {
    expect(slugify("-- Hello --")).toBe("hello");
  });
});

describe("createCourseSchema", () => {
  it("rejects a title shorter than 5 characters", () => {
    expect(createCourseSchema.safeParse({ title: "Hi", categoryId: "cat1" }).success).toBe(false);
  });

  it("rejects a missing category", () => {
    expect(createCourseSchema.safeParse({ title: "A Real Course Title", categoryId: "" }).success).toBe(false);
  });

  it("accepts a valid minimal course", () => {
    expect(createCourseSchema.safeParse({ title: "A Real Course Title", categoryId: "cat1" }).success).toBe(true);
  });
});

describe("updateCourseSchema", () => {
  const valid = {
    title: "A Real Course Title",
    subtitle: "",
    description: "This is a long enough description for the course.",
    categoryId: "cat1",
    difficulty: "BEGINNER",
    price: 0,
    thumbnailUrl: "",
    learningOutcomes: [],
    requirements: [],
  };

  it("accepts a fully valid update", () => {
    expect(updateCourseSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a description under 20 characters", () => {
    expect(updateCourseSchema.safeParse({ ...valid, description: "Too short" }).success).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(updateCourseSchema.safeParse({ ...valid, price: -10 }).success).toBe(false);
  });

  it("coerces a string price from form data into a number", () => {
    const result = updateCourseSchema.safeParse({ ...valid, price: "49.99" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.price).toBe(49.99);
  });

  it("rejects an invalid thumbnail URL", () => {
    expect(updateCourseSchema.safeParse({ ...valid, thumbnailUrl: "not a url" }).success).toBe(false);
  });

  it("allows an empty thumbnail URL (optional)", () => {
    expect(updateCourseSchema.safeParse({ ...valid, thumbnailUrl: "" }).success).toBe(true);
  });

  it("rejects an unknown difficulty value", () => {
    expect(updateCourseSchema.safeParse({ ...valid, difficulty: "EXPERT" }).success).toBe(false);
  });
});

describe("createLessonSchema", () => {
  const base = { sectionId: "sec1", title: "Intro", type: "VIDEO", durationMinutes: 5 };

  it("accepts a lesson with videoId omitted entirely (regression: FormData.get returns null, not undefined, for a field the form never rendered)", () => {
    // A QUIZ/ARTICLE/RESOURCE lesson's form has no videoId input at all —
    // formData.get("videoId") is `null`, which .nullish() must accept.
    const result = createLessonSchema.safeParse({ sectionId: "sec1", title: "Quiz", type: "QUIZ", durationMinutes: 5, videoId: null });
    expect(result.success).toBe(true);
  });

  it("accepts a lesson with videoId explicitly provided", () => {
    const result = createLessonSchema.safeParse({ ...base, videoId: "dQw4w9WgXcQ" });
    expect(result.success).toBe(true);
  });

  it("rejects a duration over 600 minutes", () => {
    expect(createLessonSchema.safeParse({ ...base, durationMinutes: 601 }).success).toBe(false);
  });

  it("rejects an unknown lesson type", () => {
    expect(createLessonSchema.safeParse({ ...base, type: "PODCAST" }).success).toBe(false);
  });
});
