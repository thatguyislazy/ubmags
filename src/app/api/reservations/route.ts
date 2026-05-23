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

// GET /api/reservations - List all reservations (with filters)
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
        ...(session.role === "DEPT_HEAD" && session.departmentId
          ? { departmentId: session.departmentId }
          : {}),
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

// GET /api/reservations/[id] - Get single reservation
export async function GET_BY_ID(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      department: true,
      user: { select: { id: true, name: true, email: true, course: true, studentNumber: true } },
      venues: { include: { resource: true } },
      equipment: { include: { resource: true } },
      services: { include: { resource: true } },
      approvals: {
        orderBy: { level: "asc" },
        include: { approver: { select: { name: true } } },
      },
      gatePasses: true,
    },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canView =
    reservation.userId === session.id ||
    canViewAllReservations(session.role) ||
    (session.role === "DEPT_HEAD" && reservation.departmentId === session.departmentId);

  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(reservation);
}

// POST /api/reservations - Create new reservation
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  if (!canCreateReservation(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // DEBUG: Log the session role
  console.log("[DEBUG] User role:", session.role);
  console.log("[DEBUG] User email:", session.email);
  console.log("[DEBUG] User name:", session.name);

  try {
    const body = await request.json();
    const parsed = reservationSchema.safeParse(body);
    
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const firstFieldError = Object.values(flat.fieldErrors)
        .flat()
        .find((m): m is string => typeof m === "string");
      const firstFormError = flat.formErrors.find((m): m is string => typeof m === "string");
      
      if (process.env.NODE_ENV !== "production") {
        console.warn("[MAGS] reservation validation failed", {
          message: firstFieldError || firstFormError,
          details: flat,
          body,
        });
      }
      
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

    // Check venue conflicts only if venues are selected
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

    // Determine initial status based on role
    const isMagsOrAdmin = session.role === "MAGS_OFFICER" || session.role === "ADMIN";
    const isFacultyOrAbove = session.role === "FACULTY" ||
      session.role === "DEPT_HEAD" ||
      session.role === "STAFF";
    const isStudent = session.role === "STUDENT";

    // DEBUG: Log the determinations
    console.log("[DEBUG] isStudent:", isStudent);
    console.log("[DEBUG] isFacultyOrAbove:", isFacultyOrAbove);
    console.log("[DEBUG] isMagsOrAdmin:", isMagsOrAdmin);

    const initialStatus = isMagsOrAdmin
      ? "APPROVED"
      : isFacultyOrAbove
      ? "SEMI_APPROVED"
      : "PENDING_DEPT";

    console.log("[DEBUG] initialStatus:", initialStatus);

    const reservation = await prisma.$transaction(async (tx) => {
      // Create the reservation
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
          // Only create venues if selected
          venues: data.venueIds && data.venueIds.length > 0 ? {
            create: data.venueIds.map((resourceId) => ({
              resourceId,
              specifyText: data.venueSpecify?.[resourceId],
            })),
          } : undefined,
          // Only create equipment if selected
          equipment: data.equipmentIds && data.equipmentIds.length > 0 ? {
            create: data.equipmentIds,
          } : undefined,
          // Only create services if selected
          services: data.serviceIds && data.serviceIds.length > 0 ? {
            create: data.serviceIds,
          } : undefined,
        },
        include: {
          venues: { include: { resource: true } },
          department: true,
        },
      });

      // Create approval logs based on role
      if (isStudent) {
        console.log("[DEBUG] Creating DEPT_HEAD approval log for student");
        // Student: needs Faculty approval first
        await tx.approvalLog.create({
          data: {
            entityType: "reservation",
            entityId: res.id,
            reservationId: res.id,
            level: ApprovalLevel.DEPT_HEAD,
            status: ApprovalStatus.PENDING,
          },
        });
      } else if (isFacultyOrAbove && !isMagsOrAdmin) {
        console.log("[DEBUG] Creating auto-approval for faculty/staff");
        // Faculty/Staff/Dept Head: auto-approve dept level, pending MAGS
        await tx.approvalLog.create({
          data: {
            entityType: "reservation",
            entityId: res.id,
            reservationId: res.id,
            level: ApprovalLevel.DEPT_HEAD,
            status: ApprovalStatus.APPROVED,
            approverId: session.id,
            remarks: "Auto-approved — requestor is faculty/staff",
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
      } else {
        console.log("[DEBUG] No approval logs created (MAGS/ADMIN)");
      }
      // MAGS/ADMIN: no approval logs needed (fully approved)

      return res;
    });

    // Send notifications based on role
    if (isStudent) {
      // Notify dept heads of the student's department
      const deptHeads = await prisma.user.findMany({
        where: { departmentId, role: "DEPT_HEAD", isActive: true },
        select: { id: true },
      });
      
      for (const head of deptHeads) {
        await createNotification({
          userId: head.id,
          type: "RESERVATION_UPDATE",
          title: "New reservation request for approval",
          message: `${session.name} submitted ${requestNumber} for "${data.eventTitle}". Needs your semi-approval.`,
          link: `/admin/approvals`,
        });
      }
      
      // Also notify faculty in same department
      const faculties = await prisma.user.findMany({
        where: { departmentId, role: "FACULTY", isActive: true },
        select: { id: true },
      });
      
      for (const faculty of faculties) {
        await createNotification({
          userId: faculty.id,
          type: "RESERVATION_UPDATE",
          title: "New reservation request for approval",
          message: `${session.name} submitted ${requestNumber} for "${data.eventTitle}". Needs your semi-approval.`,
          link: `/admin/approvals`,
        });
      }
    } else if (isFacultyOrAbove && !isMagsOrAdmin) {
      // Notify MAGS officers directly
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}