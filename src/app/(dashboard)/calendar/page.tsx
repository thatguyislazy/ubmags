import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceCalendar } from "@/components/calendar/resource-calendar";

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) return null;

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  return (
    <>
      <Header title="Reservation Calendar" unreadCount={unreadCount} />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Resource schedule & venue availability</CardTitle>
            <CardDescription>
              Live calendar: pending and approved venue bookings. Filter by room; auto-refreshes every 30 seconds
              and when you change the visible date range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResourceCalendar />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
