import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/layout/search-input";
import { Suspense } from "react";

export function Hero() {
  return (
    <section className="border-b border-border bg-gradient-to-b from-primary-subtle/60 to-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Learn skills that move your career forward
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Courses taught by working professionals, with hands-on projects, quizzes, and certificates you can share.
          </p>
          <div className="mx-auto mt-8 max-w-lg">
            <Suspense>
              <SearchInput />
            </Suspense>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/courses">
                Explore courses <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">Start free</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
