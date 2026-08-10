"use client";

import { useState, useTransition } from "react";
import { Trash2, StickyNote } from "lucide-react";
import { createNoteAction, deleteNoteAction } from "@/app/actions/notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";

function formatTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export type NoteData = { id: string; text: string; timestampSeconds: number; createdAt: string };

export function NotesPanel({
  notes,
  lessonId,
  courseSlug,
  currentTimeSeconds,
  onSeek,
}: {
  notes: NoteData[];
  lessonId: string;
  courseSlug: string;
  currentTimeSeconds: number;
  onSeek: (seconds: number) => void;
}) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!text.trim()) return;
    const noteText = text;
    setText("");
    startTransition(async () => {
      await createNoteAction({ lessonId, courseSlug, timestampSeconds: Math.floor(currentTimeSeconds), text: noteText });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Add a note at ${formatTimestamp(currentTimeSeconds)}…`}
          rows={3}
          aria-label="New note"
        />
        <Button size="sm" className="self-end" onClick={handleAdd} disabled={isPending || !text.trim()}>
          Add note
        </Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="No notes yet" description="Notes you add while watching will show up here, linked to the moment you took them." />
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li key={note.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <button
                type="button"
                onClick={() => onSeek(note.timestampSeconds)}
                className="shrink-0 rounded bg-primary-subtle px-1.5 py-0.5 font-mono text-xs font-medium text-primary hover:underline"
              >
                {formatTimestamp(note.timestampSeconds)}
              </button>
              <p className="flex-1 text-sm text-foreground">{note.text}</p>
              <form action={async () => { await deleteNoteAction(note.id, courseSlug, lessonId); }}>
                <button type="submit" aria-label="Delete note" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
