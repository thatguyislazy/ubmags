import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canViewReports } from "@/lib/rbac";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !canViewReports(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const startOfMonth = month
    ? new Date(`${month}-01`)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);

  const [
    totalReservations,
    approvedReservations,
    pendingApprovals,
    reservationsByDept,
    topVenues,
    topEquipment,
    gatePassCount,
  ] = await Promise.all([
    prisma.reservation.count({
      where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.reservation.count({
      where: { status: "APPROVED", createdAt: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.reservation.count({
      where: { status: { in: ["PENDING_DEPT", "PENDING_MAGS"] } },
    }),
    prisma.reservation.groupBy({
      by: ["departmentId"],
      where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
      _count: true,
    }),
    prisma.reservationVenue.groupBy({
      by: ["resourceId"],
      _count: true,
    }),
    prisma.reservationEquipment.groupBy({
      by: ["resourceId"],
      _count: { quantity: true },
    }),
    prisma.gatePass.count({
      where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
    }),
  ]);

  const deptIds = reservationsByDept.map((d) => d.departmentId);
  const departments = await prisma.department.findMany({
    where: { id: { in: deptIds } },
  });
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  const venueIds = topVenues.map((v) => v.resourceId);
  const venues = await prisma.resource.findMany({ where: { id: { in: venueIds } } });
  const venueMap = Object.fromEntries(venues.map((v) => [v.id, v.name]));

  const equipIds = topEquipment.map((e) => e.resourceId);
  const equipment = await prisma.resource.findMany({ where: { id: { in: equipIds } } });

  return NextResponse.json({
    period: { start: startOfMonth, end: endOfMonth },
    summary: {
      totalReservations,
      approvedReservations,
      pendingApprovals,
      gatePassCount,
      approvalRate: totalReservations
        ? Math.round((approvedReservations / totalReservations) * 100)
        : 0,
    },
    departmentActivity: reservationsByDept.map((d) => ({
      department: deptMap[d.departmentId] || d.departmentId,
      count: d._count,
    })),
    topVenues: topVenues
      .sort((a, b) => b._count - a._count)
      .slice(0, 10)
      .map((v) => ({
        name: venueMap[v.resourceId] || v.resourceId,
        count: v._count,
      })),
    topEquipment: topEquipment
      .sort((a, b) => (b._count.quantity ?? 0) - (a._count.quantity ?? 0))
      .slice(0, 10)
      .map((e) => ({
        name: equipment.find((x) => x.id === e.resourceId)?.name || e.resourceId,
        count: e._count.quantity ?? 0,
      })),
  });
}
