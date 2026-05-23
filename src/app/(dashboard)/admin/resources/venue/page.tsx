import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, DoorOpen } from "lucide-react";
import Link from "next/link";
import { ResourceCategory } from "@prisma/client";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function VenueManagementPage() {
  const session = await getSession();
  if (!session) return null;
  
  if (session.role !== "MAGS_OFFICER" && session.role !== "ADMIN") {
    return <div className="p-6 text-red-600">Access denied</div>;
  }

  const venues = await prisma.resource.findMany({
    where: { category: ResourceCategory.VENUE, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  return (
    <>
      <Header title="Venue Management" unreadCount={unreadCount} />
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-ub-maroon">Manage Venues</h2>
          <Link href="/admin/resources/venue/new">
            <Button className="bg-ub-maroon text-white hover:bg-ub-maroon/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Venue
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DoorOpen className="h-4 w-4 text-ub-maroon" />
                  {item.name}
                </CardTitle>
                <div className="flex gap-1">
                  <Link href={`/admin/resources/venue/${item.id}/edit`}>
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
                {item.requiresSpecify && (
                  <p className="text-xs text-amber-600 mt-1">Requires specification</p>
                )}
                <p className="text-xs text-gray-400 mt-2">Sort order: {item.sortOrder}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {venues.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No venues found. Click "Add Venue" to create one.
          </div>
        )}
      </div>
    </>
  );
}