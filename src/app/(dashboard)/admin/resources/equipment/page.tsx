import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Package } from "lucide-react";
import Link from "next/link";
import { ResourceCategory } from "@prisma/client";
import { DeleteButton } from "@/components/admin/delete-button";  // Make sure this path is correct

export default async function EquipmentManagementPage() {
  const session = await getSession();
  if (!session) return null;
  
  if (session.role !== "MAGS_OFFICER" && session.role !== "ADMIN") {
    return <div className="p-6 text-red-600">Access denied</div>;
  }

  const equipment = await prisma.resource.findMany({
    where: { category: ResourceCategory.EQUIPMENT, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  return (
    <>
      <Header title="Equipment Management" unreadCount={unreadCount} />
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-ub-maroon">Manage Equipment</h2>
          <Link href="/admin/resources/equipment/new">
            <Button className="bg-ub-maroon text-white hover:bg-ub-maroon/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-ub-maroon" />
                  {item.name}
                </CardTitle>
                <div className="flex gap-1">
                  <Link href={`/admin/resources/equipment/${item.id}/edit`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <DeleteButton id={item.id} name={item.name} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {item.description || "No description"}
                </p>
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Quantity:</span>
                    <span className={`text-sm font-bold ${(item.availableQuantity ?? 0) === 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {item.availableQuantity ?? 0} / {item.quantity ?? 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {equipment.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No equipment found. Click "Add Equipment" to create one.
          </div>
        )}
      </div>
    </>
  );
}