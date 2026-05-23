import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canViewAllReservations, canCreateReservation } from "@/lib/rbac";
import { reservationSchema } from "@/lib/validations/reservation";
import { checkVenueConflicts } from "@/lib/conflicts";
import { generateRequestNumber } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { ApprovalLevel, ApprovalStatus } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const where = canViewAllReservations(session.role)
    ? {
        ...(status ? { status: status as never } : {}),
      }
    : { userId: session.id, ...(status ? { status: status as never } : {}) };

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      department: true,
      user: { select: { id: true, name: true, email: true } },
      venues: { include: { resource: true } },
      equipment: { include: { resource: true } },
      services: { include: { resource: true } },
      approvals: { include: { approver: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(reservations);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canCreateReservation(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = reservationSchema.safeParse(body);

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const firstFieldError = Object.values(flat.fieldErrors)
        .flat()
        .find((m): m is string => typeof m === "string");
      const firstFormError = flat.formErrors.find((m): m is string => typeof m === "string");

      return NextResponse.json(
        {
          error: "Invalid input",
          message: firstFieldError || firstFormError || "Please check the form fields and try again.",
          details: flat,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const start = new Date(data.startDateTime);
    const end = new Date(data.endDateTime);

    let conflicts: any[] = [];
    if (data.venueIds && data.venueIds.length > 0) {
      conflicts = await checkVenueConflicts({
        venueIds: data.venueIds,
        startDateTime: start,
        endDateTime: end,
      });
    }

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: "Venue conflict detected",
          conflicts: conflicts.map((c) => ({
            requestNumber: c.requestNumber,
            eventTitle: c.eventTitle,
            start: c.startDateTime,
            end: c.endDateTime,
          })),
        },
        { status: 409 }
      );
    }

    const requestNumber = generateRequestNumber("VR");
    const departmentId = data.departmentId || session.departmentId;

    if (!departmentId) {
      return NextResponse.json({ error: "Department is required" }, { status: 400 });
    }

    const role = session.role as string;

    // Role classification
    const isMagsOrAdmin = role === "MAGS_OFFICER" || role === "ADMIN";
    const isStudent = role === "STUDENT";
    // Faculty/Staff go through dept approval first
    // DEPT_HEAD goes directly to PENDING_MAGS (skips dept approval)
    const isDeptHead = role === "DEPT_HEAD";
    const isFacultyOrStaff = role === "FACULTY" || role === "STAFF";

    // Determine initial status
    const initialStatus = isMagsOrAdmin
      ? "APPROVED"
      : isDeptHead
      ? "PENDING_MAGS"   // Dept head skips dept approval, goes straight to MAGS
      : isFacultyOrStaff
      ? "PENDING_MAGS"   // Faculty/Staff also go straight to MAGS (auto dept approval)
      : "PENDING_DEPT";  // Student needs dept approval first

    const reservation = await prisma.$transaction(async (tx) => {
      const res = await tx.reservation.create({
        data: {
          requestNumber,
          userId: session.id,
          departmentId,
          campus: data.campus,
          eventTitle: data.eventTitle,
          eventDescription: data.eventDescription,
          startDateTime: start,
          endDateTime: end,
          status: initialStatus as never,
          itemsPersonnelNote: data.itemsPersonnelNote,
          customVenueSpecify: data.customVenueSpecify,
          conformeName: data.conformeName,
          venues: data.venueIds && data.venueIds.length > 0 ? {
            create: data.venueIds.map((resourceId) => ({
              resourceId,
              specifyText: data.venueSpecify?.[resourceId],
            })),
          } : undefined,
          equipment: data.equipmentIds && data.equipmentIds.length > 0 ? {
            create: data.equipmentIds,
          } : undefined,
          services: data.serviceIds && data.serviceIds.length > 0 ? {
            create: data.serviceIds,
          } : undefined,
        },
        include: {
          venues: { include: { resource: true } },
          department: true,
        },
      });

      if (isStudent) {
        // Student: needs Dept Head approval first
        await tx.approvalLog.create({
          data: {
            entityType: "reservation",
            entityId: res.id,
            reservationId: res.id,
            level: ApprovalLevel.DEPT_HEAD,
            status: ApprovalStatus.PENDING,
          },
        });
      } else if (isDeptHead || isFacultyOrStaff) {
        // Dept Head / Faculty / Staff: auto-approve dept level, pending MAGS
        await tx.approvalLog.create({
          data: {
            entityType: "reservation",
            entityId: res.id,
            reservationId: res.id,
            level: ApprovalLevel.DEPT_HEAD,
            status: ApprovalStatus.APPROVED,
            approverId: session.id,
            remarks: "Auto-approved — requestor is faculty/dept head",
            actedAt: new Date(),
          },
        });
        await tx.approvalLog.create({
          data: {
            entityType: "reservation",
            entityId: res.id,
            reservationId: res.id,
            level: ApprovalLevel.MAGS_OFFICER,
            status: ApprovalStatus.PENDING,
          },
        });
      }
      // MAGS/ADMIN: no approval logs needed

      return res;
    });

    // Notifications
    if (isStudent) {
      const deptHeads = await prisma.user.findMany({
        where: { role: "DEPT_HEAD", isActive: true },
        select: { id: true },
      });
      for (const head of deptHeads) {
        await createNotification({
          userId: head.id,
          type: "RESERVATION_UPDATE",
          title: "New reservation request for approval",
          message: `${session.name} submitted ${requestNumber} for "${data.eventTitle}". Needs dept approval.`,
          link: `/admin/approvals`,
        });
      }
    } else if (isDeptHead || isFacultyOrStaff) {
      const magsOfficers = await prisma.user.findMany({
        where: { role: "MAGS_OFFICER", isActive: true },
        select: { id: true },
      });
      for (const officer of magsOfficers) {
        await createNotification({
          userId: officer.id,
          type: "RESERVATION_UPDATE",
          title: "New reservation request for approval",
          message: `${session.name} submitted ${requestNumber} for "${data.eventTitle}". Ready for MAGS approval.`,
          link: `/admin/approvals`,
        });
      }
    }

    await logAudit({
      userId: session.id,
      action: "CREATE_RESERVATION",
      entityType: "reservation",
      entityId: reservation.id,
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (err) {
    console.error("[MAGS] POST /api/reservations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}