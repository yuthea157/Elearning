"use client";

import { useActionState, useRef, useEffect } from "react";
import { createSectionAction, type CurriculumFormState } from "@/app/actions/curriculum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddSectionForm({ courseId }: { courseId: string }) {
  const [state, formAction, isPending] = useActionState<CurriculumFormState, FormData>(createSectionAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.errors) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex items-start gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      <div className="flex-1">
        <Input name="title" placeholder="New section title (e.g. Getting Started)" required />
        {state?.errors?.title && <p className="mt-1 text-sm text-destructive">{state.errors.title[0]}</p>}
      </div>
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Adding…" : "Add section"}
      </Button>
    </form>
  );
}
