import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/rbac";
import { canAccessAdmin, canApproveDept, canApproveMags } from "@/lib/rbac";
import { DoorOpen, ClipboardCheck, Clock, CheckCircle } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  // Build pending count where clause — no departmentId filter for DEPT_HEAD
  const role = session.role as string;
  const buildPendingWhere = () => {
    if (role === "DEPT_HEAD") {
      return { status: "PENDING_DEPT" };
    }
    if (role === "MAGS_OFFICER") {
      return { status: "PENDING_MAGS" };
    }
    if (role === "ADMIN") {
      return { status: { in: ["PENDING_DEPT", "PENDING_MAGS"] } };
    }
    return null;
  };

  // Build reservations where clause for recent reservations list
  const buildReservationsWhere = () => {
    if (role === "STUDENT" || role === "FACULTY") {
      return { userId: session.id };
    }
    if (role === "DEPT_HEAD") {
      return {}; // sees all departments
    }
    return {};
  };

  const pendingWhere = buildPendingWhere();

  const [reservations, gatePasses, unreadCount, pendingCount] = await Promise.all([
    prisma.reservation.findMany({
      where: buildReservationsWhere(),
      include: { venues: { include: { resource: true } }, department: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.gatePass.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.notification.count({ where: { userId: session.id, read: false } }),
    pendingWhere
      ? prisma.reservation.count({ where: pendingWhere })
      : Promise.resolve(0),
  ]);

  const stats = [
    {
      label: "My Reservations",
      value: await prisma.reservation.count({ where: { userId: session.id } }),
      icon: DoorOpen,
      href: "/reservations",
    },
    {
      label: "Gate Passes",
      value: await prisma.gatePass.count({ where: { userId: session.id } }),
      icon: ClipboardCheck,
      href: "/gate-passes",
    },
    {
      label: "Pending Approvals",
      value: pendingCount,
      icon: Clock,
      href: "/admin/approvals",
      show: canAccessAdmin(session.role) || canApproveDept(session.role),
    },
    {
      label: "Approved",
      value: await prisma.reservation.count({
        where: { userId: session.id, status: "APPROVED" },
      }),
      icon: CheckCircle,
      href: "/reservations?status=APPROVED",
    },
  ];

  return (
    <>
      <Header title="Dashboard" unreadCount={unreadCount} />
      <div className="p-6 space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-ub-maroon to-ub-maroon-dark p-6 text-white">
          <p className="text-sm text-white/70">Welcome back,</p>
          <h2 className="text-2xl font-bold">{session.name}</h2>
          <p className="text-sm text-ub-gold">{ROLE_LABELS[session.role]}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats
            .filter((s) => s.show !== false)
            .map((stat) => (
              <Link key={stat.label} href={stat.href}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="rounded-lg bg-ub-maroon/10 p-3">
                      <stat.icon className="h-6 w-6 text-ub-maroon" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ub-maroon">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Reservations</CardTitle>
              <Link href="/reservations/new">
                <Button size="sm">New Request</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <p className="text-sm text-gray-500">No reservations yet.</p>
              ) : (
                <ul className="space-y-3">
                  {reservations.map((r) => (
                    <li key={r.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                      <div>
                        <Link href={`/reservations/${r.id}`} className="font-medium text-ub-maroon hover:underline">
                          {r.eventTitle}
                        </Link>
                        <p className="text-xs text-gray-500">{r.requestNumber}</p>
                        <p className="text-xs text-gray-400">{formatDateTime(r.startDateTime)}</p>
                      </div>
                      <Badge status={r.status}>{r.status.replace(/_/g, " ")}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gate Passes</CardTitle>
              <Link href="/gate-passes/new">
                <Button size="sm" variant="outline">
                  Request Pass
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {gatePasses.length === 0 ? (
                <p className="text-sm text-gray-500">No gate passes yet.</p>
              ) : (
                <ul className="space-y-3">
                  {gatePasses.map((g) => (
                    <li key={g.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{g.equipmentType}</p>
                        <p className="text-xs text-gray-500">{g.passNumber}</p>
                      </div>
                      <Badge status={g.status}>{g.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}