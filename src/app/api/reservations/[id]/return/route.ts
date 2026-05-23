import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ReservationStatus } from "@prisma/client";
import { createNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only MAGS_OFFICER and ADMIN can return equipment
    if (session.role !== "MAGS_OFFICER" && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { remarks } = await request.json();

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { 
        equipment: { include: { resource: true } },
        user: true
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Check if reservation is approved
    if (reservation.status !== "APPROVED") {
      return NextResponse.json({ error: "Reservation is not approved" }, { status: 400 });
    }

    // Check if reservation period has ended
    if (new Date(reservation.endDateTime) > new Date()) {
      return NextResponse.json({ error: "Reservation period has not ended yet" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Return quantities back to available stock
      for (const item of reservation.equipment) {
        await tx.resource.update({
          where: { id: item.resourceId },
          data: {
            availableQuantity: {
              increment: item.quantity,
            },
          },
        });
      }

      // Update reservation status to COMPLETED
      await tx.reservation.update({
        where: { id },
        data: { 
          status: ReservationStatus.COMPLETED,
        },
      });
    });

    // Create notification for student
    await createNotification({
      userId: reservation.userId,
      type: "RESERVATION_UPDATE",
      title: "Equipment Returned",
      message: `Your reservation ${reservation.requestNumber} has been marked as returned. Thank you!`,
      link: `/reservations/${id}`,
    });

    await logAudit({
      userId: session.id,
      action: "RETURN_EQUIPMENT",
      entityType: "reservation",
      entityId: id,
      metadata: { remarks },
    });

    return NextResponse.json({ success: true, status: "COMPLETED" });
    
  } catch (error) {
    console.error("Error returning equipment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}