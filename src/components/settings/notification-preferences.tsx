"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateNotificationPreferenceAction } from "@/app/actions/notifications";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PREFS: { field: "emailEnabled" | "courseCompletionEnabled" | "newCourseEnabled" | "subscriptionEnabled" | "systemEnabled"; label: string; description: string }[] = [
  { field: "courseCompletionEnabled", label: "Course completions & certificates", description: "When you finish a course or earn a certificate." },
  { field: "newCourseEnabled", label: "New courses from instructors you follow", description: "When an instructor you follow publishes something new." },
  { field: "subscriptionEnabled", label: "Billing & subscription", description: "Payment confirmations, failures, and cancellations." },
  { field: "systemEnabled", label: "Platform announcements", description: "Occasional updates about the platform itself." },
];

type Preferences = Record<(typeof PREFS)[number]["field"], boolean>;

export function NotificationPreferences({ preferences }: { preferences: Preferences }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {PREFS.map((pref) => (
        <div key={pref.field} className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor={pref.field} className="font-normal text-foreground">
              {pref.label}
            </Label>
            <p className="text-sm text-muted-foreground">{pref.description}</p>
          </div>
          <Switch
            id={pref.field}
            checked={preferences[pref.field]}
            disabled={isPending}
            onCheckedChange={(checked) =>
              startTransition(async () => {
                try {
                  await updateNotificationPreferenceAction(pref.field, checked);
                } catch {
                  toast.error("Couldn't update preference — please try again.");
                }
              })
            }
          />
        </div>
      ))}
    </div>
  );
}
