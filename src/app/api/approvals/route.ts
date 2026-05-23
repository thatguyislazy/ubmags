import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { approvalSchema } from "@/lib/validations/reservation";
import { createNotification } from "@/lib/notifications";
import { emailUserOnDecision } from "@/lib/email-notifications";
import { logAudit } from "@/lib/audit";
import { canApproveDept, canApproveMags } from "@/lib/rbac";
import { ApprovalLevel, ApprovalStatus } from "@prisma/client";
import { MAGS_OFFICER_NAME } from "@/lib/constants";
import QRCode from "qrcode";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.role as string;

  // 1 Dept Head sees ALL departments — no departmentId filter
  const buildWhere = () => {
    if (role === "DEPT_HEAD") {
      return { status: "PENDING_DEPT" };
    }
    if (role === "MAGS_OFFICER") {
      return { status: "PENDING_MAGS" };
    }
    if (role === "ADMIN") {
      return { status: { in: ["PENDING_DEPT", "PENDING_MAGS"] } };
    }
    return { id: "none" }; // fallback — no results for unrecognized roles
  };

  const pendingReservations = await prisma.reservation.findMany({
    where: buildWhere(),
    include: {
      user: { select: { name: true, email: true } },
      department: true,
      venues: { include: { resource: true } },
    },
    orderBy: { filingDate: "asc" },
  });

  const pendingGatePasses = canApproveMags(session.role)
    ? await prisma.gatePass.findMany({
        where: { status: "PENDING" },
        include: { user: { select: { name: true } } },
        orderBy: { dateFiled: "asc" },
      })
    : [];

  return NextResponse.json({ reservations: pendingReservations, gatePasses: pendingGatePasses });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = approvalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { entityType, entityId, action, remarks, signatureName } = parsed.data;
    const approved = action === "approve";

    if (entityType === "reservation") {
      const reservation = await prisma.reservation.findUnique({ where: { id: entityId } });
      if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

      if (reservation.status === "PENDING_DEPT") {
        if (!canApproveDept(session.role)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        // Removed per-department check — 1 Dept Head approves all departments

        await prisma.$transaction(async (tx) => {
          await tx.approvalLog.updateMany({
            where: { reservationId: entityId, level: ApprovalLevel.DEPT_HEAD },
            data: {
              status: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
              approverId: session.id,
              remarks,
              signatureName: signatureName || session.name,
              actedAt: new Date(),
            },
          });

          if (approved) {
            await tx.reservation.update({
              where: { id: entityId },
              data: { status: "PENDING_MAGS" },
            });
            await tx.approvalLog.create({
              data: {
                entityType: "reservation",
                entityId,
                reservationId: entityId,
                level: ApprovalLevel.MAGS_OFFICER,
                status: ApprovalStatus.PENDING,
              },
            });
          } else {
            await tx.reservation.update({
              where: { id: entityId },
              data: { status: "REJECTED", rejectionReason: remarks },
            });
          }
        });

        const magsOfficers = await prisma.user.findMany({
          where: { role: { in: ["MAGS_OFFICER", "ADMIN"] }, isActive: true },
        });
        if (approved) {
          for (const o of magsOfficers) {
            await createNotification({
              userId: o.id,
              type: "APPROVAL",
              title: "Reservation awaiting MAGS approval",
              message: `${reservation.requestNumber} — ${reservation.eventTitle}`,
              link: `/admin/approvals`,
            });
          }
        } else {
          await createNotification({
            userId: reservation.userId,
            type: "REJECTION",
            title: "Reservation not approved at department",
            message: `Your request ${reservation.requestNumber} was not approved by the department.`,
            link: `/reservations/${entityId}`,
          });
          await emailUserOnDecision({
            userId: reservation.userId,
            title: "Reservation update — department",
            message: `Your reservation ${reservation.requestNumber} (${reservation.eventTitle}) was not approved at the department level.${remarks ? ` Remarks: ${remarks}` : ""}`,
            link: `/reservations/${entityId}`,
          });
        }
      } else if (reservation.status === "PENDING_MAGS") {
        if (!canApproveMags(session.role)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.$transaction(async (tx) => {
          await tx.approvalLog.updateMany({
            where: { reservationId: entityId, level: ApprovalLevel.MAGS_OFFICER },
            data: {
              status: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
              approverId: session.id,
              remarks,
              signatureName: signatureName || MAGS_OFFICER_NAME,
              actedAt: new Date(),
            },
          });

          await tx.reservation.update({
            where: { id: entityId },
            data: approved
              ? { status: "APPROVED" }
              : { status: "REJECTED", rejectionReason: remarks },
          });
        });

        await createNotification({
          userId: reservation.userId,
          type: approved ? "APPROVAL" : "REJECTION",
          title: approved ? "Reservation fully approved" : "Reservation declined",
          message: `Your request ${reservation.requestNumber} has been ${approved ? "approved by MAGS" : "declined by MAGS"}.`,
          link: `/reservations/${entityId}`,
        });
        await emailUserOnDecision({
          userId: reservation.userId,
          title: approved ? "Venue reservation approved" : "Venue reservation declined",
          message: `Your reservation ${reservation.requestNumber} (${reservation.eventTitle}) was ${approved ? "approved" : "declined"} by MAGS.${remarks ? ` Remarks: ${remarks}` : ""}`,
          link: `/reservations/${entityId}`,
        });
      }
    }

    if (entityType === "gate_pass") {
      if (!canApproveMags(session.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const gatePass = await prisma.gatePass.findUnique({ where: { id: entityId } });
      if (!gatePass) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const qrData = `MAGS-GP:${gatePass.passNumber}:${gatePass.id}`;
      const qrCodeData = await QRCode.toDataURL(qrData);

      await prisma.gatePass.update({
        where: { id: entityId },
        data: approved
          ? {
              status: "APPROVED",
              approvedByName: signatureName || MAGS_OFFICER_NAME,
              approvedAt: new Date(),
              qrCodeData,
            }
          : { status: "REJECTED", rejectionReason: remarks },
      });

      await createNotification({
        userId: gatePass.userId,
        type: approved ? "APPROVAL" : "REJECTION",
        title: approved ? "Gate pass approved" : "Gate pass rejected",
        message: `Gate pass ${gatePass.passNumber} has been ${approved ? "approved" : "rejected"}.`,
        link: `/gate-passes/${entityId}`,
      });
      await emailUserOnDecision({
        userId: gatePass.userId,
        title: approved ? "Gate pass approved" : "Gate pass declined",
        message: `Gate pass ${gatePass.passNumber} for ${gatePass.equipmentType} was ${approved ? "approved" : "declined"}.${remarks ? ` Remarks: ${remarks}` : ""}`,
        link: `/gate-passes/${entityId}`,
      });
    }

    await logAudit({
      userId: session.id,
      action: `APPROVAL_${action.toUpperCase()}`,
      entityType,
      entityId,
      metadata: { remarks },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}