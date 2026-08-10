"use client";

import { useActionState } from "react";
import { createCourseAction, type CourseFormState } from "@/app/actions/instructor-courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function NewCourseForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState<CourseFormState, FormData>(createCourseAction, null);

  return (
    <form action={formAction} className="space-y-5">
      {state?.formError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.formError}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="title">Course title</Label>
        <Input id="title" name="title" placeholder="e.g. Intro to Product Analytics" required />
        {state?.errors?.title && <p className="text-sm text-destructive">{state.errors.title[0]}</p>}
        <p className="text-sm text-muted-foreground">You can refine this later — focus on getting started.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <Select name="categoryId">
          <SelectTrigger id="categoryId" className="w-full">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state?.errors?.categoryId && <p className="text-sm text-destructive">{state.errors.categoryId[0]}</p>}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create course"}
      </Button>
    </form>
  );
}
