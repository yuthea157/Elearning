"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setUserStatusAction } from "@/app/actions/admin-users";
import { Button } from "@/components/ui/button";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import { DeleteUserButton } from "@/components/admin/delete-user-button";

type RowUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
};

export function UserRowActions({ user, isSelf }: { user: RowUser; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isSuspended = user.status === "SUSPENDED";

  return (
    <div className="flex items-center justify-end gap-2">
      <EditUserDialog user={user} isSelf={isSelf} />
      <Button
        size="sm"
        variant={isSuspended ? "outline" : "destructive"}
        disabled={isPending || isSelf}
        onClick={() => {
          if (!isSuspended && !window.confirm("Suspend this user? They won't be able to sign in until reactivated.")) return;
          startTransition(async () => {
            try {
              await setUserStatusAction(user.id, isSuspended ? "ACTIVE" : "SUSPENDED");
              toast.success(isSuspended ? "User reactivated." : "User suspended.");
              router.refresh();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Something went wrong.");
            }
          });
        }}
      >
        {isSuspended ? "Reactivate" : "Suspend"}
      </Button>
      {!isSelf && <DeleteUserButton userId={user.id} userName={user.name} />}
    </div>
  );
}
