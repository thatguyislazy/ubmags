import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ApprovalLevel, ApprovalStatus, ReservationStatus } from "@prisma/client";
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

    const { id } = await params;
    const body = await request.json();
    const { action, remarks, signatureName } = body;

    // Validate required fields based on action
    if (action && action !== "cancel" && !remarks) {
      return NextResponse.json({ error: "Remarks are required" }, { status: 400 });
    }

    if (action && ["semi_approve", "approve", "decline"].includes(action) && !signatureName) {
      return NextResponse.json({ error: "Signature name is required" }, { status: 400 });
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { 
        approvals: true, 
        user: true,
        equipment: {
          include: { resource: true }
        }
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // DEBUG: Log equipment data
    console.log("========== APPROVE DEBUG ==========");
    console.log("Reservation ID:", id);
    console.log("Equipment count:", reservation.equipment.length);
    console.log("Equipment data:", JSON.stringify(reservation.equipment, null, 2));
    console.log("==================================");

    const role = session.role;

    // ── CANCEL (Student only) ────────
    if (action === "cancel") {
      if (reservation.userId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!["PENDING_DEPT", "PENDING_MAGS"].includes(reservation.status)) {
        return NextResponse.json({ error: "Cannot cancel at this stage" }, { status: 400 });
      }
      
      await prisma.reservation.update({
        where: { id },
        data: { status: ReservationStatus.CANCELLED },
      });
      
      await logAudit({
        userId: session.id,
        action: "CANCEL_RESERVATION",
        entityType: "reservation",
        entityId: id,
      });
      
      return NextResponse.json({ success: true, status: "CANCELLED" });
    }

    // ── SEMI-APPROVE (Faculty/Dept Head/Staff) ────────────────────────────────
    if (action === "semi_approve") {
      if (role !== "FACULTY" && role !== "DEPT_HEAD" && role !== "STAFF") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (reservation.status !== "PENDING_DEPT") {
        return NextResponse.json(
          { error: "Reservation is not pending department approval" },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        const deptLog = reservation.approvals.find(
          (a) => a.level === ApprovalLevel.DEPT_HEAD &&
                 a.status === ApprovalStatus.PENDING
        );
        if (deptLog) {
          await tx.approvalLog.update({
            where: { id: deptLog.id },
            data: {
              status: ApprovalStatus.APPROVED,
              approverId: session.id,
              signatureName,
              remarks: remarks || null,
              actedAt: new Date(),
            },
          });
        }
        
        await tx.approvalLog.create({
          data: {
            entityType: "reservation",
            entityId: id,
            reservationId: id,
            level: ApprovalLevel.MAGS_OFFICER,
            status: ApprovalStatus.PENDING,
          },
        });
        
        await tx.reservation.update({
          where: { id },
          data: { status: ReservationStatus.PENDING_MAGS },
        });
      });

      const magsOfficers = await prisma.user.findMany({
        where: { role: "MAGS_OFFICER", isActive: true },
        select: { id: true },
      });
      
      for (const officer of magsOfficers) {
        await createNotification({
          userId: officer.id,
          type: "APPROVAL",
          title: "Reservation ready for MAGS approval",
          message: `${reservation.requestNumber} was approved by department. Ready for MAGS review.`,
          link: `/admin/approvals`,
        });
      }
      
      await createNotification({
        userId: reservation.userId,
        type: "RESERVATION_UPDATE",
        title: "Reservation approved by department",
        message: `Your reservation ${reservation.requestNumber} was approved by your department. Waiting for MAGS approval.`,
        link: `/reservations/${id}`,
      });

      await logAudit({
        userId: session.id,
        action: "DEPARTMENT_APPROVE_RESERVATION",
        entityType: "reservation",
        entityId: id,
      });
      
      return NextResponse.json({ success: true, status: "PENDING_MAGS" });
    }

    // ── APPROVE (MAGS Officer / Admin) with quantity deduction ─────────────────
    if (action === "approve") {
      if (role !== "MAGS_OFFICER" && role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (reservation.status !== "PENDING_MAGS") {
        return NextResponse.json(
          { error: "Reservation is not pending MAGS approval" },
          { status: 400 }
        );
      }

      // Check if there are any equipment items
      if (reservation.equipment.length === 0) {
        console.log("[WARNING] No equipment found in this reservation!");
      }

      // Check if there's enough available quantity for all equipment
      for (const item of reservation.equipment) {
        const availableQty = item.resource.availableQuantity ?? 0;
        console.log(`[DEBUG] Checking ${item.resource.name}: requested ${item.quantity}, available ${availableQty}`);
        
        if (item.quantity > availableQty) {
          return NextResponse.json(
            { 
              error: `Not enough ${item.resource.name} available. Only ${availableQty} left, but you requested ${item.quantity}.` 
            },
            { status: 400 }
          );
        }
      }

      await prisma.$transaction(async (tx) => {
        const magsLog = reservation.approvals.find(
          (a) => a.level === ApprovalLevel.MAGS_OFFICER &&
                 a.status === ApprovalStatus.PENDING
        );
        if (magsLog) {
          await tx.approvalLog.update({
            where: { id: magsLog.id },
            data: {
              status: ApprovalStatus.APPROVED,
              approverId: session.id,
              signatureName,
              remarks: remarks || null,
              actedAt: new Date(),
            },
          });
        }
        
        // Deduct equipment quantities from available stock
        for (const item of reservation.equipment) {
          console.log(`[DEBUG] Deducting ${item.quantity} from ${item.resource.name}`);
          
          const beforeUpdate = await tx.resource.findUnique({
            where: { id: item.resourceId },
            select: { availableQuantity: true }
          });
          console.log(`[DEBUG] Before deduction: ${beforeUpdate?.availableQuantity}`);
          
          await tx.resource.update({
            where: { id: item.resourceId },
            data: {
              availableQuantity: {
                decrement: item.quantity,
              },
            },
          });
          
          const afterUpdate = await tx.resource.findUnique({
            where: { id: item.resourceId },
            select: { availableQuantity: true }
          });
          console.log(`[DEBUG] After deduction: ${afterUpdate?.availableQuantity}`);
        }
        
        await tx.reservation.update({
          where: { id },
          data: { status: ReservationStatus.APPROVED },
        });
      });

      await createNotification({
        userId: reservation.userId,
        type: "APPROVAL",
        title: "Reservation fully approved!",
        message: `Your reservation ${reservation.requestNumber} has been approved by MAGS.`,
        link: `/reservations/${id}`,
      });

      await logAudit({
        userId: session.id,
        action: "MAGS_APPROVE_RESERVATION",
        entityType: "reservation",
        entityId: id,
      });
      
      return NextResponse.json({ success: true, status: "APPROVED" });
    }

    // ── DECLINE (Department OR MAGS) ─────────────────────────────────────────
    if (action === "decline") {
      const canDeclineDept =
        (role === "FACULTY" || role === "DEPT_HEAD" || role === "STAFF") &&
        reservation.status === "PENDING_DEPT";
      const canDeclineMags =
        (role === "MAGS_OFFICER" || role === "ADMIN") &&
        reservation.status === "PENDING_MAGS";

      if (!canDeclineDept && !canDeclineMags) {
        return NextResponse.json(
          { error: "Forbidden or invalid stage" },
          { status: 403 }
        );
      }

      const level = canDeclineDept
        ? ApprovalLevel.DEPT_HEAD
        : ApprovalLevel.MAGS_OFFICER;

      await prisma.$transaction(async (tx) => {
        const log = reservation.approvals.find(
          (a) => a.level === level && a.status === ApprovalStatus.PENDING
        );
        if (log) {
          await tx.approvalLog.update({
            where: { id: log.id },
            data: {
              status: ApprovalStatus.REJECTED,
              approverId: session.id,
              signatureName,
              remarks: remarks || null,
              actedAt: new Date(),
            },
          });
        }
        
        await tx.reservation.update({
          where: { id },
          data: { 
            status: ReservationStatus.DECLINED,
            rejectionReason: remarks || null,
          },
        });
      });

      await createNotification({
        userId: reservation.userId,
        type: "REJECTION",
        title: "Reservation declined",
        message: `Your reservation ${reservation.requestNumber} was declined. Reason: ${remarks || "No reason provided."}`,
        link: `/reservations/${id}`,
      });

      await logAudit({
        userId: session.id,
        action: "DECLINE_RESERVATION",
        entityType: "reservation",
        entityId: id,
      });
      
      return NextResponse.json({ success: true, status: "DECLINED" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error("Error in reservation approval route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}