import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Clock } from "lucide-react";
import { listCourses, getCategories } from "@/lib/data/courses";
import { getRecentSearches } from "@/lib/data/search";
import { getOptionalCurrentUser } from "@/lib/auth/dal";
import { CourseCard } from "@/components/course/course-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Search — E-Learning" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const user = await getOptionalCurrentUser();

  const [{ courses, total }, categories, recentSearches] = await Promise.all([
    query ? listCourses({ query, pageSize: 24 }) : Promise.resolve({ courses: [], total: 0 }),
    query || !user ? Promise.resolve([]) : getCategories(),
    user ? getRecentSearches(user.id) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-semibold text-foreground">
        {query ? `Results for "${query}"` : "Search courses"}
      </h1>
      {query && <p className="mt-1 text-sm text-muted-foreground">{total.toLocaleString()} results</p>}

      <div className="mt-8">
        {!query ? (
          <div className="flex flex-col gap-8">
            {recentSearches.length > 0 && (
              <div>
                <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Clock className="size-4" aria-hidden="true" /> Recent searches
                </h2>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((s) => (
                    <Link key={s.id} href={`/search?q=${encodeURIComponent(s.query)}`}>
                      <Badge variant="secondary" className="cursor-pointer px-3 py-1.5 text-sm hover:bg-secondary/70">
                        {s.query}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {categories.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-foreground">Popular categories</h2>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <Link key={c.slug} href={`/categories/${c.slug}`}>
                      <Badge variant="outline" className="cursor-pointer px-3 py-1.5 text-sm hover:bg-secondary">
                        {c.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {recentSearches.length === 0 && categories.length === 0 && (
              <EmptyState icon={SearchX} title="Start typing to search" description="Search by course title, topic, or instructor name." />
            )}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No results found"
            description="Try a different search term, or browse courses by category instead."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
