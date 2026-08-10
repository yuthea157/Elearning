"use client";

import { useActionState } from "react";
import { updateCourseAction, type CourseFormState } from "@/app/actions/instructor-courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Course = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  categoryId: string | null;
  difficulty: string;
  price: number;
  thumbnailUrl: string | null;
  learningOutcomes: string[];
  requirements: string[];
};

export function CourseMetadataForm({ course, categories }: { course: Course; categories: { id: string; name: string }[] }) {
  const action = updateCourseAction.bind(null, course.id);
  const [state, formAction, isPending] = useActionState<CourseFormState, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-5">
      {state?.formError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.formError}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={course.title} required />
        {state?.errors?.title && <p className="text-sm text-destructive">{state.errors.title[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Input id="subtitle" name="subtitle" defaultValue={course.subtitle ?? ""} placeholder="One sentence describing the course" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={course.description} rows={5} required />
        {state?.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category</Label>
          <Select name="categoryId" defaultValue={course.categoryId ?? undefined}>
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select name="difficulty" defaultValue={course.difficulty}>
            <SelectTrigger id="difficulty" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BEGINNER">Beginner</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
              <SelectItem value="ADVANCED">Advanced</SelectItem>
              <SelectItem value="ALL_LEVELS">All levels</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price (USD, 0 = free)</Label>
          <Input id="price" name="price" type="number" min={0} step={0.01} defaultValue={course.price ? String(course.price) : "0"} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
        <Input id="thumbnailUrl" name="thumbnailUrl" defaultValue={course.thumbnailUrl ?? ""} placeholder="https://…" />
        {state?.errors?.thumbnailUrl && <p className="text-sm text-destructive">{state.errors.thumbnailUrl[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="learningOutcomes">What you&apos;ll learn (one per line)</Label>
        <Textarea id="learningOutcomes" name="learningOutcomes" defaultValue={course.learningOutcomes.join("\n")} rows={4} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirements">Requirements (one per line)</Label>
        <Textarea id="requirements" name="requirements" defaultValue={course.requirements.join("\n")} rows={3} />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
