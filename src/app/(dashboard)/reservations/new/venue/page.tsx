import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VenueReservationForm } from "@/components/forms/venue-reservation-form";

export default async function NewVenueReservationPage() {
  const session = await getSession();
  if (!session) return null;

  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  return (
    <>
      <Header title="New Venue Reservation" unreadCount={unreadCount} />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>F-MAGS LC-10 Venue Reservation Form</CardTitle>
          </CardHeader>
          <CardContent>
            <VenueReservationForm
              departments={departments}
              defaultDepartmentId={session.departmentId}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}