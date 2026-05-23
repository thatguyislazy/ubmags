import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
  return NextResponse.json(departments);
}
