import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SearchX } from "lucide-react";
import { getCategoryBySlug, listCourses } from "@/lib/data/courses";
import { CourseCard } from "@/components/course/course-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return { title: `${category.name} courses — E-Learning`, description: category.description ?? undefined };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = Number(pageParam ?? 1) || 1;
  const { courses, total, pageCount } = await listCourses({ categorySlug: slug, sort: "popular", page });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground">{category.name}</h1>
      {category.description && <p className="mt-2 max-w-2xl text-muted-foreground">{category.description}</p>}
      <p className="mt-1 text-sm text-muted-foreground">{total.toLocaleString()} courses</p>

      {category.children.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:bg-secondary"
            >
              {child.name} ({child._count.courses})
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        {courses.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No courses in this category yet"
            description="Check back soon, or explore other categories in the meantime."
            action={
              <Link href="/courses" className="text-sm font-medium text-primary hover:underline">
                Browse all courses
              </Link>
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
                    <PaginationPrevious href={page > 1 ? `/categories/${slug}?page=${page - 1}` : undefined} aria-disabled={page <= 1} />
                  </PaginationItem>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink href={`/categories/${slug}?page=${p}`} isActive={p === page}>
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext href={page < pageCount ? `/categories/${slug}?page=${page + 1}` : undefined} aria-disabled={page >= pageCount} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
}
