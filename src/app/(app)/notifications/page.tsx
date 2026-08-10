import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { getAllNotifications } from "@/lib/data/notifications";
import { EmptyState } from "@/components/ui/empty-state";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";

export const metadata: Metadata = { title: "Notifications — E-Learning" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const notifications = await getAllNotifications(user.id);
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Notifications</h1>
        {hasUnread && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="Course completions, certificates, and account updates will show up here." />
      ) : (
        <NotificationsList
          notifications={notifications.map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            isRead: n.isRead,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
