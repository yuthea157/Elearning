import { requirePageRole } from "@/lib/auth/dal";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole("ADMIN");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-heading text-2xl font-semibold text-foreground sm:text-3xl">Admin</h1>
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="sm:w-48 sm:shrink-0">
          <AdminNav />
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
