import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { gatePassSchema } from "@/lib/validations/reservation";
import { generateRequestNumber } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { canRequestGatePass, canApproveMags } from "@/lib/rbac";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where = canApproveMags(session.role) && searchParams.get("all") === "true"
    ? { ...(status ? { status: status as never } : {}) }
    : { userId: session.id, ...(status ? { status: status as never } : {}) };

  const gatePasses = await prisma.gatePass.findMany({
    where,
    include: { equipment: { include: { resource: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(gatePasses);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canRequestGatePass(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = gatePassSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const passNumber = generateRequestNumber("GP");

    const gatePass = await prisma.gatePass.create({
      data: {
        passNumber,
        userId: session.id,
        reservationId: data.reservationId,
        requestorName: data.requestorName,
        course: data.course,
        studentNumber: data.studentNumber,
        equipmentType: data.equipmentType,
        equipmentDescription: data.equipmentDescription,
        brand: data.brand,
        serialNumber: data.serialNumber,
        model: data.model,
        purpose: data.purpose,
        entryDateTime: new Date(data.entryDateTime),
        pullOutDateTime: new Date(data.pullOutDateTime),
        status: "PENDING",
        equipment: data.equipment?.length
          ? { create: data.equipment }
          : undefined,
      },
    });

    const officers = await prisma.user.findMany({
      where: { role: { in: ["MAGS_OFFICER", "ADMIN"] }, isActive: true },
    });
    for (const o of officers) {
      await createNotification({
        userId: o.id,
        type: "RESERVATION_UPDATE",
        title: "New gate pass request",
        message: `${passNumber} from ${data.requestorName}`,
        link: "/admin/approvals",
      });
    }

    await logAudit({
      userId: session.id,
      action: "CREATE_GATE_PASS",
      entityType: "gate_pass",
      entityId: gatePass.id,
    });

    return NextResponse.json(gatePass, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
