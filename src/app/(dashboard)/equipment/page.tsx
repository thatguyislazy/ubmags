import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EquipmentPage() {
  const session = await getSession();
  if (!session) return null;

  const equipment = await prisma.resource.findMany({
    where: { category: "EQUIPMENT", isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  return (
    <>
      <Header title="Equipment Inventory" unreadCount={unreadCount} />
      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((eq) => (
            <Card key={eq.id}>
              <CardHeader>
                <CardTitle className="text-base">{eq.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{eq.description || "Available for reservation"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
