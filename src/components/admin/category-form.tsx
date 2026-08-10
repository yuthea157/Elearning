"use client";

import { useActionState, useRef, useEffect } from "react";
import { createCategoryAction, type CategoryFormState } from "@/app/actions/admin-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CategoryForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState<CategoryFormState, FormData>(createCategoryAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.errors) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-start gap-2 rounded-xl border border-dashed border-border p-4">
      <div className="min-w-[180px] flex-1">
        <Input name="name" placeholder="New category name" required />
        {state?.errors?.name && <p className="mt-1 text-sm text-destructive">{state.errors.name[0]}</p>}
      </div>
      <Select name="parentId" defaultValue="none">
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Top-level category</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              Under {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add category"}
      </Button>
    </form>
  );
}
