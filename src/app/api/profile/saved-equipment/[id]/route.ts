import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({
  label: z.string().min(1).optional(),
  equipmentType: z.string().min(1).optional(),
  equipmentDescription: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.savedEquipment.findFirst({
    where: { id, userId: session.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.savedEquipment.update({
    where: { id },
    data: { ...parsed.data },
  });

  await logAudit({
    userId: session.id,
    action: "SAVED_EQUIPMENT_UPDATE",
    entityType: "saved_equipment",
    entityId: id,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.savedEquipment.findFirst({
    where: { id, userId: session.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.savedEquipment.delete({ where: { id } });

  await logAudit({
    userId: session.id,
    action: "SAVED_EQUIPMENT_DELETE",
    entityType: "saved_equipment",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
