import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconBadge, iconBadgeColorForIndex } from "@/components/ui/icon-badge";

type Category = { slug: string; name: string; icon: string | null; _count: { courses: number } };

export function CategoryGrid({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="border-y border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-6 font-heading text-2xl font-semibold text-foreground">Popular categories</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category, index) => {
            const Icon = (category.icon && (Icons as unknown as Record<string, LucideIcon>)[category.icon]) || Icons.Layers;
            return (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <IconBadge icon={Icon} color={iconBadgeColorForIndex(index)} />
                <div>
                  <p className="font-medium text-foreground">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{category._count.courses} courses</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
