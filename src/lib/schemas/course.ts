import { z } from "zod";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const createCourseSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(120),
  categoryId: z.string().min(1, "Choose a category."),
});

export const updateCourseSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters.").max(120),
  subtitle: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().min(20, "Description must be at least 20 characters."),
  categoryId: z.string().min(1, "Choose a category."),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"]),
  price: z.coerce.number().min(0).max(10000),
  thumbnailUrl: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
  learningOutcomes: z.array(z.string().trim().min(1)).max(20),
  requirements: z.array(z.string().trim().min(1)).max(20),
});

export const createSectionSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(2, "Section title is required.").max(120),
});

export const createLessonSchema = z.object({
  sectionId: z.string().min(1),
  title: z.string().trim().min(2, "Lesson title is required.").max(150),
  type: z.enum(["VIDEO", "QUIZ", "ARTICLE", "RESOURCE"]),
  durationMinutes: z.coerce.number().min(0).max(600),
  // FormData.get() returns null for a field that isn't in the submitted
  // form at all (e.g. the video-ID input, only rendered for VIDEO-type
  // lessons) — nullish() accepts that, where optional() only accepts
  // undefined and would reject a present-but-null value.
  videoId: z.string().trim().max(20).nullish(),
  isPreview: z.coerce.boolean().optional(),
});

export { slugify };
