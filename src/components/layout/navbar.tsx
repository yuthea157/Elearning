import Link from "next/link";
import { Suspense } from "react";
import { getOptionalCurrentUser } from "@/lib/auth/dal";
import { getUnreadNotificationCount, getRecentNotifications } from "@/lib/data/notifications";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/layout/search-input";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";

const LINKS = [
  { href: "/courses", label: "Courses" },
  { href: "/categories", label: "Categories" },
  { href: "/pricing", label: "Pricing" },
];

export async function Navbar() {
  const user = await getOptionalCurrentUser();
  const [unreadCount, notifications] = user
    ? await Promise.all([getUnreadNotificationCount(user.id), getRecentNotifications(user.id)])
    : [0, []];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Suspense>
          <MobileNav isAuthed={!!user} />
        </Suspense>

        <Link href="/" className="font-heading text-lg font-semibold text-foreground">
          E-Learning
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden flex-1 max-w-md sm:block">
          <Suspense>
            <SearchInput />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <NotificationDropdown
                unreadCount={unreadCount}
                notifications={notifications.map((n) => ({
                  id: n.id,
                  title: n.title,
                  body: n.body,
                  isRead: n.isRead,
                  createdAt: n.createdAt.toISOString(),
                  relatedCourseId: n.relatedCourseId,
                }))}
              />
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
