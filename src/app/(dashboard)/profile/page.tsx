import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SavedEquipmentManager } from "@/components/profile/saved-equipment-manager";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      email: true,
      name: true,
      studentNumber: true,
      course: true,
      phone: true,
      department: true,
      role: true,
    },
  });

  const items = await prisma.savedEquipment.findMany({
    where: { userId: session.id },
    orderBy: { label: "asc" },
  });

  return (
    <>
      <Header title="My Profile" unreadCount={unreadCount} />
      <div className="p-6 max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Name:</span> {user?.name}
            </p>
            <p>
              <span className="text-gray-500">Email:</span> {user?.email}
            </p>
            <p>
              <span className="text-gray-500">Role:</span> {user?.role}
            </p>
            <p>
              <span className="text-gray-500">Department:</span> {user?.department?.name ?? "—"}
            </p>
            {(user?.studentNumber || user?.course) && (
              <>
                <p>
                  <span className="text-gray-500">Student number:</span> {user?.studentNumber ?? "—"}
                </p>
                <p>
                  <span className="text-gray-500">Course:</span> {user?.course ?? "—"}
                </p>
              </>
            )}
            <p className="text-xs text-gray-400 pt-2">
              Username and credentials are reviewed by MAGS administrators; contact Admin to change roles.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved equipment (quick-fill gate passes)</CardTitle>
            <CardDescription>
              Store laptops, cameras, and other borrowed items so serial numbers and models auto-fill when you
              create a gate pass — no need to type them again each time (F-MAGS LC-06).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SavedEquipmentManager initialItems={items} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
