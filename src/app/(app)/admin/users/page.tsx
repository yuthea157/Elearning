import type { Metadata } from "next";
import { getAllUsers } from "@/lib/data/admin";
import { getCurrentUser } from "@/lib/auth/dal";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata: Metadata = { title: "Manage users — E-Learning admin" };

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-primary-subtle text-primary",
  INSTRUCTOR: "bg-accent text-accent-foreground",
  STUDENT: "bg-muted text-muted-foreground",
};

export default async function AdminUsersPage() {
  const [users, currentUser] = await Promise.all([getAllUsers(), getCurrentUser()]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold text-foreground">Users</h2>
        <p className="text-sm text-muted-foreground">{users.length} shown</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
                      <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge className={ROLE_BADGE[user.role]} variant="secondary">
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.status === "SUSPENDED" ? "destructive" : "secondary"}>{user.status}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <UserRowActions user={user} isSelf={user.id === currentUser.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
