import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canViewAllReservations } from "@/lib/rbac";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      department: true,
      user: { select: { id: true, name: true, email: true, course: true, studentNumber: true } },
      venues: { include: { resource: true } },
      equipment: { include: { resource: true } },
      services: { include: { resource: true } },
      approvals: {
        orderBy: { level: "asc" },
        include: { approver: { select: { name: true } } },
      },
      gatePasses: true,
    },
  });

  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canView =
    reservation.userId === session.id ||
    canViewAllReservations(session.role) ||
    (session.role === "DEPT_HEAD" && reservation.departmentId === session.departmentId);

  if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(reservation);
}
