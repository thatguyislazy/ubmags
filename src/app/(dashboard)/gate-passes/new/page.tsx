import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GatePassForm } from "@/components/forms/gate-pass-form";

export default async function NewGatePassPage() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  return (
    <>
      <Header title="New Gate Pass" unreadCount={unreadCount} />
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>F-MAGS LC-06 Gate Pass</CardTitle>
          </CardHeader>
          <CardContent>
            <GatePassForm
              defaultName={user?.name}
              defaultCourse={user?.course}
              defaultStudentNumber={user?.studentNumber}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
