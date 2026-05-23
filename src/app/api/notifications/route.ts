import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.id, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids, markAll } = await request.json();

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.id, read: false },
      data: { read: true },
    });
  } else if (ids?.length) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: session.id },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}
