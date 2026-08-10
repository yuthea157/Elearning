"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { updateCategoryAction } from "@/app/actions/admin-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

type EditableCategory = { id: string; name: string; parentId: string | null; hasChildren: boolean };

export function EditCategoryDialog({
  category,
  topLevelCategories,
}: {
  category: EditableCategory;
  topLevelCategories: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const parentOptions = topLevelCategories.filter((c) => c.id !== category.id);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = await updateCategoryAction(category.id, null, formData);
      if (result?.errors) {
        setErrors(result.errors);
        return;
      }
      if (result?.formError) {
        setFormError(result.formError);
        return;
      }
      toast.success("Category updated.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon-sm" variant="outline" aria-label="Edit category">
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit category</DialogTitle>
          <DialogDescription>Renaming regenerates the URL slug automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-category-name">Name</Label>
            <Input id="edit-category-name" name="name" defaultValue={category.name} required />
            {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-category-parent">Parent</Label>
            <Select name="parentId" defaultValue={category.parentId ?? "none"} disabled={category.hasChildren}>
              <SelectTrigger id="edit-category-parent" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Top-level category</SelectItem>
                {parentOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    Under {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {category.hasChildren && (
              <p className="text-xs text-muted-foreground">Has subcategories, so it can&apos;t be made a subcategory itself.</p>
            )}
            {errors.parentId && <p className="text-sm text-destructive">{errors.parentId[0]}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
