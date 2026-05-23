import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { canManageUsers } from "@/lib/rbac";

export default async function AdminDepartmentsPage() {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) redirect("/dashboard");

  const departments = await prisma.department.findMany({
    include: { _count: { select: { users: true, reservations: true } } },
    orderBy: { name: "asc" },
  });

  const unreadCount = await prisma.notification.count({ where: { userId: session.id, read: false } });

  return (
    <>
      <Header title="Departments" unreadCount={unreadCount} />
      <div className="p-6 grid gap-4 sm:grid-cols-2">
        {departments.map((d) => (
          <div key={d.id} className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="font-mono text-xs text-ub-maroon">{d.code}</p>
            <h3 className="font-semibold">{d.name}</h3>
            <p className="mt-2 text-sm text-gray-500">
              {d._count.users} users · {d._count.reservations} reservations
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
