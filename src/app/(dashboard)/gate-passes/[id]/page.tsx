import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { MAGS_OFFICER_NAME } from "@/lib/constants";

export default async function GatePassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const { id } = await params;

  const gatePass = await prisma.gatePass.findUnique({ where: { id } });
  if (!gatePass || (gatePass.userId !== session.id && !["ADMIN", "MAGS_OFFICER"].includes(session.role))) {
    notFound();
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  return (
    <>
      <Header title={`Gate Pass ${gatePass.passNumber}`} unreadCount={unreadCount} />
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>F-MAGS LC-06 Gate Pass</CardTitle>
            <Badge status={gatePass.status}>{gatePass.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-gray-500">Date Filed</span><p>{formatDateTime(gatePass.dateFiled)}</p></div>
              <div><span className="text-gray-500">Name</span><p>{gatePass.requestorName}</p></div>
              <div><span className="text-gray-500">Course</span><p>{gatePass.course || "—"}</p></div>
              <div><span className="text-gray-500">SN</span><p>{gatePass.studentNumber || "—"}</p></div>
              <div className="col-span-2"><span className="text-gray-500">Type / Kind</span><p>{gatePass.equipmentType}</p></div>
              <div className="col-span-2"><span className="text-gray-500">Description</span><p>{gatePass.equipmentDescription || "—"}</p></div>
              <div><span className="text-gray-500">Brand</span><p>{gatePass.brand || "—"}</p></div>
              <div><span className="text-gray-500">Serial No.</span><p>{gatePass.serialNumber || "—"}</p></div>
              <div><span className="text-gray-500">Model</span><p>{gatePass.model || "—"}</p></div>
              <div className="col-span-2"><span className="text-gray-500">Purpose</span><p>{gatePass.purpose}</p></div>
              <div><span className="text-gray-500">Entry</span><p>{formatDateTime(gatePass.entryDateTime)}</p></div>
              <div><span className="text-gray-500">Pull-Out</span><p>{formatDateTime(gatePass.pullOutDateTime)}</p></div>
            </div>
            <div className="border-t pt-4">
              <p className="mb-2 text-xs font-medium text-ub-maroon">Electronic approval tracking</p>
              <p className="text-gray-500 text-xs mb-2">
                MAGS authorization is captured digitally (typed approver name and timestamp). Printed PDF matches the official LC-06 layout.
              </p>
              <p className="text-gray-500">Approved by</p>
              <p className="font-medium">{gatePass.approvedByName || MAGS_OFFICER_NAME}</p>
              <p className="text-xs text-gray-400">MAGS Officer (electronic signature)</p>
              {gatePass.approvedAt && (
                <p className="text-xs text-gray-500 mt-1">Confirmed: {formatDateTime(gatePass.approvedAt)}</p>
              )}
            </div>
            {gatePass.status === "APPROVED" && (
              <div className="flex gap-3">
                <a href={`/api/gate-passes/${gatePass.id}/pdf`} target="_blank" rel="noreferrer">
                  <Button>Download PDF</Button>
                </a>
                {gatePass.qrCodeData && (
                  <img src={gatePass.qrCodeData} alt="QR Code" className="h-24 w-24" />
                )}
              </div>
            )}
            <Link href="/gate-passes" className="text-ub-maroon hover:underline text-sm">
              ← Back to gate passes
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
