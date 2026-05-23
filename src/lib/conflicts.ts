import { prisma } from "@/lib/db";
import { ReservationStatus } from "@prisma/client";

const BLOCKING_STATUSES: ReservationStatus[] = [
  "PENDING_DEPT",
  "PENDING_MAGS",
  "APPROVED",
];

export async function checkVenueConflicts(params: {
  venueIds: string[];
  startDateTime: Date;
  endDateTime: Date;
  excludeReservationId?: string;
}) {
  const { venueIds, startDateTime, endDateTime, excludeReservationId } = params;

  const conflicts = await prisma.reservation.findMany({
    where: {
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      status: { in: BLOCKING_STATUSES },
      AND: [
        { startDateTime: { lt: endDateTime } },
        { endDateTime: { gt: startDateTime } },
      ],
      venues: {
        some: { resourceId: { in: venueIds } },
      },
    },
    include: {
      venues: { include: { resource: true } },
      user: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  return conflicts;
}

export async function getResourceAvailability(params: {
  resourceId: string;
  startDateTime: Date;
  endDateTime: Date;
}) {
  const conflicts = await checkVenueConflicts({
    venueIds: [params.resourceId],
    startDateTime: params.startDateTime,
    endDateTime: params.endDateTime,
  });

  return {
    available: conflicts.length === 0,
    conflicts,
  };
}
