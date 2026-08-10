"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Segment = { id: string; order: number; startSeconds: number; text: string };

function formatTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TranscriptPanel({
  segments,
  currentTimeSeconds,
  onSeek,
}: {
  segments: Segment[];
  currentTimeSeconds: number;
  onSeek: (seconds: number) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => segments.filter((s) => s.text.toLowerCase().includes(query.toLowerCase())),
    [segments, query]
  );

  if (segments.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No transcript available for this lesson.</p>;
  }

  const activeSegment = [...segments].reverse().find((s) => s.startSeconds <= currentTimeSeconds);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transcript…"
          className="pl-9"
          aria-label="Search transcript"
        />
      </div>
      <ul className="flex max-h-96 flex-col gap-1 overflow-y-auto">
        {filtered.map((segment) => (
          <li key={segment.id}>
            <button
              type="button"
              onClick={() => onSeek(segment.startSeconds)}
              className={cn(
                "flex w-full items-start gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary",
                activeSegment?.id === segment.id && "bg-primary-subtle"
              )}
            >
              <span className="mt-0.5 shrink-0 font-mono text-xs text-muted-foreground">{formatTimestamp(segment.startSeconds)}</span>
              <span className="text-foreground">{segment.text}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <p className="px-2 py-4 text-sm text-muted-foreground">No matches for &quot;{query}&quot;.</p>}
      </ul>
    </div>
  );
}
