import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { ReservationActions } from "@/components/reservations/reservation-actions";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { id } = await params;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      department: true,
      user: { select: { name: true, email: true, id: true } },
      venues: { include: { resource: true } },
      equipment: { include: { resource: true } },
      services: { include: { resource: true } },
      approvals: { 
        orderBy: { level: "asc" }, 
        include: { approver: { select: { name: true } } } 
      },
    },
  });

  if (!reservation) notFound();

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  const copies = ["MAGS copy", "BMD's copy", "Security's copy"] as const;

  // Check if reservation has equipment
  const hasEquipment = reservation.equipment.length > 0;

  return (
    <>
      <Header title={reservation.requestNumber} unreadCount={unreadCount} />
      <div className="p-6 max-w-3xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{reservation.eventTitle}</CardTitle>
              <p className="text-sm text-gray-500">{reservation.department.name} · {reservation.campus}</p>
            </div>
            <Badge status={reservation.status}>{reservation.status.replace(/_/g, " ")}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p><span className="text-gray-500">Schedule:</span> {formatDateTime(reservation.startDateTime)} — {formatDateTime(reservation.endDateTime)}</p>
            <p><span className="text-gray-500">Requested by:</span> {reservation.user.name}</p>
            
            {reservation.venues.length > 0 && (
              <p><span className="text-gray-500">Venues:</span> {reservation.venues.map((v) => v.resource.name + (v.specifyText ? ` (${v.specifyText})` : "")).join(", ")}</p>
            )}
            
            {reservation.customVenueSpecify && (
              <p><span className="text-gray-500">Other venue:</span> {reservation.customVenueSpecify}</p>
            )}
            
            {reservation.itemsPersonnelNote && (
              <p><span className="text-gray-500">Items/Personnel:</span> {reservation.itemsPersonnelNote}</p>
            )}
            
            {reservation.equipment.length > 0 && (
              <p><span className="text-gray-500">Equipment:</span> {reservation.equipment.map((e) => `${e.resource.name} (×${e.quantity})`).join(", ")}</p>
            )}
            
            {reservation.services.length > 0 && (
              <p><span className="text-gray-500">Services:</span> {reservation.services.map((s) => s.resource.name).join(", ")}</p>
            )}

            {reservation.rejectionReason && (
              <div className="rounded-lg bg-red-50 p-3 text-red-700">
                <span className="font-medium">Reason for decline:</span> {reservation.rejectionReason}
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-medium text-ub-maroon mb-1">Electronic approval & signatures</h4>
              <p className="text-xs text-gray-500 mb-3">
                Below is the online tracking trail. Approvers confirm with a typed name that replaces a wet signature for this system; remarks are stored for audit.
              </p>
              <ul className="space-y-3">
                {reservation.approvals.map((a) => (
                  <li key={a.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{a.level.replace(/_/g, " ")}</span>
                      <Badge status={a.status}>{a.status}</Badge>
                    </div>
                    {a.signatureName && (
                      <p className="mt-1 text-gray-700">
                        <span className="text-gray-500">Signature (typed):</span> {a.signatureName}
                      </p>
                    )}
                    {a.approver && (
                      <p className="text-xs text-gray-500">
                        Approver account: {a.approver.name}
                        {a.actedAt && ` · ${formatDateTime(a.actedAt)}`}
                      </p>
                    )}
                    {a.remarks && (
                      <div className="mt-2 rounded-md bg-red-50 p-2 border-l-4 border-red-500">
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Remarks:</p>
                        <p className="text-sm font-bold text-gray-800 mt-0.5">{a.remarks}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Approval Action Buttons - with hasEquipment and endDateTime */}
            <ReservationActions
              reservationId={reservation.id}
              status={reservation.status}
              userId={reservation.user.id}
              sessionId={session.id}
              sessionRole={session.role}
              hasEquipment={hasEquipment}
              endDateTime={reservation.endDateTime}
            />

            {/* Download PDF copies - only for approved reservations */}
            {reservation.status === "APPROVED" && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <p className="w-full text-xs text-gray-500 mb-1">Download PDF copies:</p>
                {copies.map((copy) => (
                  <a key={copy} href={`/api/reservations/${id}/pdf?copy=${encodeURIComponent(copy)}`} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">PDF — {copy}</Button>
                  </a>
                ))}
              </div>
            )}

            <Link href="/reservations" className="block text-ub-maroon hover:underline">← Back to reservations</Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}