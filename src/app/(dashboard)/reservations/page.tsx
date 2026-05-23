import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { canViewAllReservations } from "@/lib/rbac";
import { Plus } from "lucide-react";

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { status } = await searchParams;

  const reservations = await prisma.reservation.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(canViewAllReservations(session.role)
        ? session.role === "DEPT_HEAD" && session.departmentId
          ? { departmentId: session.departmentId }
          : session.role === "STUDENT" || session.role === "FACULTY"
            ? { userId: session.id }
            : {}
        : { userId: session.id }),
    },
    include: {
      department: true,
      user: { select: { name: true } },
      venues: { include: { resource: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  return (
    <>
      <Header title="Reservations" unreadCount={unreadCount} />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">F-MAGS LC-10 Venue Reservation requests</p>
          <Link href="/reservations/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Reservation
            </Button>
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-ub-maroon text-left text-white">
              <tr>
                <th className="px-4 py-3">Request #</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Venues</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{r.requestNumber}</td>
                  <td className="px-4 py-3 font-medium">{r.eventTitle}</td>
                  <td className="px-4 py-3">{r.department.name}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDateTime(r.startDateTime)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.venues.map((v) => v.resource.name).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={r.status}>{r.status.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/reservations/${r.id}`} className="text-ub-maroon hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reservations.length === 0 && (
            <p className="p-8 text-center text-gray-500">No reservations found.</p>
          )}
        </div>
      </div>
    </>
  );
}
