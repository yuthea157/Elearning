"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Award, GraduationCap, CreditCard, Info, Bell } from "lucide-react";
import { markNotificationReadAction } from "@/app/actions/notifications";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, typeof Bell> = {
  COURSE_COMPLETED: GraduationCap,
  CERTIFICATE_ISSUED: Award,
  NEW_COURSE_FROM_INSTRUCTOR: Bell,
  SUBSCRIPTION_EVENT: CreditCard,
  SYSTEM: Info,
};

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <ul className="flex flex-col gap-2">
      {notifications.map((n) => {
        const Icon = TYPE_ICON[n.type] ?? Bell;
        return (
          <li
            key={n.id}
            className={cn("flex items-start gap-3 rounded-xl border border-border p-4", !n.isRead && "bg-primary-subtle/50")}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(n.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            {!n.isRead && (
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-primary hover:underline"
                onClick={() =>
                  startTransition(async () => {
                    await markNotificationReadAction(n.id);
                    router.refresh();
                  })
                }
              >
                Mark read
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
