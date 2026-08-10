"use client";

import { useActionState } from "react";
import { updateOwnProfileAction, type EditProfileState } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Account = { name: string; username: string; email: string };

export function EditAccountForm({ account }: { account: Account }) {
  const [state, formAction, isPending] = useActionState<EditProfileState, FormData>(updateOwnProfileAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.formError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.formError}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="account-name">Name</Label>
        <Input id="account-name" name="name" defaultValue={account.name} required />
        {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-username">Username</Label>
        <Input id="account-username" name="username" defaultValue={account.username} required />
        {state?.errors?.username && <p className="text-sm text-destructive">{state.errors.username[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="account-email">Email</Label>
        <Input id="account-email" name="email" type="email" defaultValue={account.email} required />
        {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        {state?.success && <p className="text-sm text-success">Saved.</p>}
      </div>
    </form>
  );
}
