import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { canManageUsers } from "@/lib/rbac";
import { ROLE_LABELS } from "@/lib/rbac";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    include: { department: true },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  return (
    <>
      <Header title="Manage Users" unreadCount={unreadCount} />
      <div className="p-6">
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-ub-maroon text-left text-white">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[u.role]}</td>
                  <td className="px-4 py-3">{u.department?.name ?? "—"}</td>
                  <td className="px-4 py-3">{u.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
