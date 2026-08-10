"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteUserAction } from "@/app/actions/admin-users";
import { Button } from "@/components/ui/button";

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      aria-label="Delete user"
      className="text-muted-foreground hover:text-destructive"
      onClick={() => {
        if (!window.confirm(`Delete ${userName}? This can't be undone from the admin panel.`)) return;
        startTransition(async () => {
          try {
            await deleteUserAction(userId);
            toast.success("User deleted.");
            router.refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Something went wrong.");
          }
        });
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
