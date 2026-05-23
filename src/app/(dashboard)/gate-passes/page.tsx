import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function GatePassesPage() {
  const session = await getSession();
  if (!session) return null;

  const gatePasses = await prisma.gatePass.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  return (
    <>
      <Header title="Gate Passes" unreadCount={unreadCount} />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">F-MAGS LC-06 Gate Pass requests</p>
          <Link href="/gate-passes/new">
            <Button>
              <Plus className="h-4 w-4" />
              New Gate Pass
            </Button>
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-ub-maroon text-left text-white">
              <tr>
                <th className="px-4 py-3">Pass #</th>
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">Pull-Out</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {gatePasses.map((g) => (
                <tr key={g.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{g.passNumber}</td>
                  <td className="px-4 py-3">{g.equipmentType}</td>
                  <td className="px-4 py-3">{formatDateTime(g.entryDateTime)}</td>
                  <td className="px-4 py-3">{formatDateTime(g.pullOutDateTime)}</td>
                  <td className="px-4 py-3">
                    <Badge status={g.status}>{g.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/gate-passes/${g.id}`} className="text-ub-maroon hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {gatePasses.length === 0 && (
            <p className="p-8 text-center text-gray-500">No gate passes yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
