"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteCategoryAction } from "@/app/actions/admin-categories";

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-label="Delete category"
      className="text-muted-foreground hover:text-destructive disabled:opacity-50"
      onClick={() => {
        if (!window.confirm("Delete this category? This can't be undone.")) return;
        startTransition(async () => {
          try {
            await deleteCategoryAction(categoryId);
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
          }
        });
      }}
    >
      <Trash2 className="size-4" />
    </button>
  );
}
