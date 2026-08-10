"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { logSearchAction } from "@/app/actions/search";

export function SearchInput({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <form
      role="search"
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const query = new FormData(e.currentTarget).get("q");
        if (typeof query === "string" && query.trim()) {
          void logSearchAction(query);
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
      }}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          name="q"
          placeholder="Search courses, topics, instructors…"
          className="pl-9"
          defaultValue={searchParams.get("q") ?? ""}
          aria-label="Search courses"
        />
      </div>
    </form>
  );
}
