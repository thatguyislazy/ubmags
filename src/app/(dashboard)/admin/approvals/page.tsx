import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ApprovalStatus } from "@prisma/client";

export default async function AdminApprovalsPage() {
  const session = await getSession();
  if (!session) return null;

  // Only allow MAGS_OFFICER, ADMIN, DEPT_HEAD, FACULTY to access
  if (!["MAGS_OFFICER", "ADMIN", "DEPT_HEAD", "FACULTY", "STAFF"].includes(session.role)) {
    return <div className="p-6 text-red-600">Access denied</div>;
  }

  // Fetch pending reservations based on role
  const where: any = {
    status: {
      in: ["PENDING_DEPT", "PENDING_MAGS"]
    }
  };

  // For DEPT_HEAD/FACULTY, only show reservations from their department
  if (session.role === "DEPT_HEAD" || session.role === "FACULTY" || session.role === "STAFF") {
    where.departmentId = session.departmentId;
    where.status = "PENDING_DEPT"; // Only show pending dept approvals
  }

  // For MAGS_OFFICER/ADMIN, show all pending MAGS approvals
  if (session.role === "MAGS_OFFICER" || session.role === "ADMIN") {
    where.status = "PENDING_MAGS";
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      department: true,
      venues: { include: { resource: true } },
      equipment: { include: { resource: true } },
      services: { include: { resource: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING_DEPT": return "Pending Department Approval";
      case "PENDING_MAGS": return "Pending MAGS Approval";
      default: return status;
    }
  };

  return (
    <>
      <Header title="Pending Approvals" unreadCount={unreadCount} />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-ub-maroon">
            {session.role === "MAGS_OFFICER" || session.role === "ADMIN" 
              ? "MAGS Approvals" 
              : "Department Approvals"}
          </h2>
          <p className="text-sm text-gray-500">
            {reservations.length} pending reservation(s) for approval
          </p>
        </div>

        <div className="space-y-4">
          {reservations.map((reservation) => (
            <Card key={reservation.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{reservation.requestNumber}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {reservation.eventTitle}
                  </p>
                </div>
                <Badge status={reservation.status}>
                  {getStatusLabel(reservation.status)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 text-sm">
                  <p>
                    <span className="text-gray-500">Requested by:</span>{" "}
                    {reservation.user.name}
                  </p>
                  <p>
                    <span className="text-gray-500">Department:</span>{" "}
                    {reservation.department.name}
                  </p>
                  <p>
                    <span className="text-gray-500">Campus:</span>{" "}
                    {reservation.campus}
                  </p>
                  <p>
                    <span className="text-gray-500">Schedule:</span>{" "}
                    {new Date(reservation.startDateTime).toLocaleString()} —{" "}
                    {new Date(reservation.endDateTime).toLocaleString()}
                  </p>
                  
                  {/* Show venues if any */}
                  {reservation.venues.length > 0 && (
                    <p>
                      <span className="text-gray-500">Venues:</span>{" "}
                      {reservation.venues.map(v => v.resource.name).join(", ")}
                    </p>
                  )}
                  
                  {/* Show equipment if any */}
                  {reservation.equipment.length > 0 && (
                    <p>
                      <span className="text-gray-500">Equipment:</span>{" "}
                      {reservation.equipment.map(e => `${e.resource.name} (×${e.quantity})`).join(", ")}
                    </p>
                  )}
                  
                  {/* Show services if any */}
                  {reservation.services.length > 0 && (
                    <p>
                      <span className="text-gray-500">Services:</span>{" "}
                      {reservation.services.map(s => s.resource.name).join(", ")}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <Link href={`/reservations/${reservation.id}`}>
                    <Button variant="outline" size="sm">
                      Review & Approve
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          {reservations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No pending approvals at this time.
            </div>
          )}
        </div>
      </div>
    </>
  );
}