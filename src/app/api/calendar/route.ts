import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const resourceId = searchParams.get("resourceId");

  const reservations = await prisma.reservation.findMany({
    where: {
      status: { in: ["PENDING_DEPT", "PENDING_MAGS", "APPROVED"] },
      ...(start && end
        ? {
            startDateTime: { lte: new Date(end) },
            endDateTime: { gte: new Date(start) },
          }
        : {}),
      ...(resourceId
        ? { venues: { some: { resourceId } } }
        : {}),
    },
    include: {
      venues: { include: { resource: true } },
      department: true,
      user: { select: { name: true } },
    },
  });

  const events = reservations.map((r) => ({
    id: r.id,
    title: `${r.venues.map((v) => v.resource.name).join(", ") || "Venue"} · ${r.eventTitle}`,
    start: r.startDateTime,
    end: r.endDateTime,
    status: r.status,
    requestNumber: r.requestNumber,
    department: r.department.name,
    requestor: r.user.name,
    venues: r.venues.map((v) => v.resource.name),
    backgroundColor:
      r.status === "APPROVED"
        ? "#166534"
        : r.status === "PENDING_MAGS"
          ? "#c2410c"
          : "#b45309",
  }));

  return NextResponse.json(events);
}
