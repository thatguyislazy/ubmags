import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import Link from "next/link";
import { ResourceCategory } from "@prisma/client";

export default async function EquipmentManagementPage() {
  const session = await getSession();
  if (!session) return null;
  
  // Only MAGS_OFFICER and ADMIN can access
  if (session.role !== "MAGS_OFFICER" && session.role !== "ADMIN") {
    return <div className="p-6 text-red-600">Access denied</div>;
  }

  const equipment = await prisma.resource.findMany({
    where: { category: ResourceCategory.EQUIPMENT, isActive: true },
    orderBy: { sortOrder: "asc" },
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
                  <form action={`/api/admin/resources/${item.id}/delete`} method="POST">
                    <Button 
                      type="submit" 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        if (!confirm(`Delete "${item.name}"? This action cannot be undone.`)) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {item.description || "No description"}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-400">Sort order: {item.sortOrder}</p>
                  <p className={`text-xs font-medium ${item.availableQuantity === 0 ? 'text-red-600' : 'text-green-600'}`}>
                    Stock: {item.availableQuantity} / {item.quantity}
                  </p>
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