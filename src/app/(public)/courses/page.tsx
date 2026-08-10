import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { listCourses, getCategories } from "@/lib/data/courses";
import type { CourseDifficulty } from "@/generated/prisma/client";
import { CourseCard } from "@/components/course/course-card";
import { CourseFilters } from "@/components/course/course-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Explore courses — E-Learning" };

type SearchParams = {
  category?: string;
  difficulty?: string;
  price?: string;
  sort?: string;
  q?: string;
  page?: string;
};

export default async function CoursesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;

  const [{ courses, total, pageCount }, categories] = await Promise.all([
    listCourses({
      query: params.q,
      categorySlug: params.category,
      difficulty: params.difficulty as CourseDifficulty | undefined,
      priceType: params.price as "free" | "paid" | undefined,
      sort: params.sort as "relevance" | "popular" | "rating" | "newest" | undefined,
      page,
    }),
    getCategories(),
  ]);

  function pageHref(targetPage: number) {
    const query = new URLSearchParams({ ...params, page: String(targetPage) } as Record<string, string>);
    return `/courses?${query.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold text-foreground">Explore courses</h1>
        <p className="text-sm text-muted-foreground">{total.toLocaleString()} courses</p>
      </div>
      <div className="mb-8">
        <Suspense>
          <CourseFilters categories={categories} />
        </Suspense>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No courses match these filters"
          description="Try a different category, level, or price — or clear all filters to see everything."
          action={
            <Button asChild variant="outline">
              <Link href="/courses">Clear filters</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>

          {pageCount > 1 && (
            <Pagination className="mt-10">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href={page > 1 ? pageHref(page - 1) : undefined} aria-disabled={page <= 1} />
                </PaginationItem>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink href={pageHref(p)} isActive={p === page}>
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href={page < pageCount ? pageHref(page + 1) : undefined} aria-disabled={page >= pageCount} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
