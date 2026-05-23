import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canManageUsers } from "@/lib/rbac";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8).optional(),
  role: z.enum(["STUDENT", "FACULTY", "STAFF", "DEPT_HEAD", "MAGS_OFFICER", "ADMIN"]),
  departmentId: z.string().optional(),
  studentNumber: z.string().optional(),
  course: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      studentNumber: true,
      course: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password || "ChangeMe123!");
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      passwordHash,
      role: parsed.data.role,
      departmentId: parsed.data.departmentId,
      studentNumber: parsed.data.studentNumber,
      course: parsed.data.course,
      isActive: parsed.data.isActive ?? true,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json(user, { status: 201 });
}
