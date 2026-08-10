import type { Metadata } from "next";
import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCategories } from "@/lib/data/courses";

export const metadata: Metadata = { title: "Browse categories — E-Learning" };

export default async function CategoriesIndexPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground">Browse by category</h1>
      <p className="mt-2 text-muted-foreground">{categories.length} categories</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const Icon = (category.icon && (Icons as unknown as Record<string, LucideIcon>)[category.icon]) || Icons.Layers;
          return (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-medium text-foreground">{category.name}</p>
                <p className="text-sm text-muted-foreground">{category._count.courses} courses</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
