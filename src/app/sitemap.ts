import type { MetadataRoute } from "next";
import { getPublishedCourseSlugs, getCategories } from "@/lib/data/courses";

// Rendered on-demand rather than at build time, like every other
// DB-backed route in this app — the alternative (static prerender)
// runs concurrently with the rest of the build's parallel workers and
// exhausts the Supabase session pooler's connection cap.
export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, categories] = await Promise.all([getPublishedCourseSlugs(), getCategories()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${APP_URL}/courses`, changeFrequency: "daily", priority: 0.9 },
    { url: `${APP_URL}/categories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${APP_URL}/pricing`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const courseRoutes: MetadataRoute.Sitemap = courses.map((course) => ({
    url: `${APP_URL}/courses/${course.slug}`,
    lastModified: course.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${APP_URL}/categories/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...courseRoutes, ...categoryRoutes];
}
