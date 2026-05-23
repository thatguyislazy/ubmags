import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const savedSchema = z.object({
  label: z.string().min(1),
  equipmentType: z.string().min(1),
  equipmentDescription: z.string().optional(),
  brand: z.string().optional(),
  serialNumber: z.string().optional(),
  model: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.savedEquipment.findMany({
    where: { userId: session.id },
    orderBy: [{ label: "asc" }],
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = savedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.savedEquipment.create({
    data: { userId: session.id, ...parsed.data },
  });

  await logAudit({
    userId: session.id,
    action: "SAVED_EQUIPMENT_CREATE",
    entityType: "saved_equipment",
    entityId: item.id,
  });

  return NextResponse.json(item, { status: 201 });
}
