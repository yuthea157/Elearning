"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createLessonAction, type CurriculumFormState } from "@/app/actions/curriculum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AddLessonForm({ sectionId }: { sectionId: string }) {
  const [state, formAction, isPending] = useActionState<CurriculumFormState, FormData>(createLessonAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState("VIDEO");

  useEffect(() => {
    if (!state?.errors) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
      <input type="hidden" name="sectionId" value={sectionId} />
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-[180px] flex-1">
          <Input name="title" placeholder="Lesson title" required />
          {state?.errors?.title && <p className="mt-1 text-sm text-destructive">{state.errors.title[0]}</p>}
        </div>
        <Select name="type" value={type} onValueChange={setType}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="VIDEO">Video</SelectItem>
            <SelectItem value="QUIZ">Quiz</SelectItem>
            <SelectItem value="ARTICLE">Article</SelectItem>
            <SelectItem value="RESOURCE">Resource</SelectItem>
          </SelectContent>
        </Select>
        <Input name="durationMinutes" type="number" min={0} placeholder="Minutes" className="w-24" required />
      </div>

      {type === "VIDEO" && (
        <div>
          <Input name="videoId" placeholder="YouTube video ID (e.g. dQw4w9WgXcQ)" />
          <p className="mt-1 text-xs text-muted-foreground">
            The 11-character ID from a YouTube URL. Leave blank to add a video later.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Checkbox id={`preview-${sectionId}`} name="isPreview" />
        <Label htmlFor={`preview-${sectionId}`} className="font-normal text-muted-foreground">
          Free preview (visible without enrolling)
        </Label>
      </div>

      <Button type="submit" size="sm" className="w-fit" disabled={isPending}>
        {isPending ? "Adding…" : "Add lesson"}
      </Button>
    </form>
  );
}
