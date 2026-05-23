import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import { logAudit } from "@/lib/audit";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Registration body:", body); // Debug log
    
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      console.log("Validation errors:", parsed.error.flatten()); // Debug log
      const firstError = parsed.error.errors[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Get a default department if none provided
    let departmentId = parsed.data.departmentId;
    if (!departmentId) {
      const defaultDept = await prisma.department.findFirst();
      if (defaultDept) {
        departmentId = defaultDept.id;
      }
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const verifyToken = randomBytes(32).toString("hex");

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash,
        role: parsed.data.role || "STUDENT",
        departmentId: departmentId,
        studentNumber: parsed.data.studentNumber,
        course: parsed.data.course,
        phone: parsed.data.phone,
        verifyToken,
        isActive: true,
        emailVerified: new Date(), // Auto-verify for testing
      },
    });

    // Create session
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
    });

    await logAudit({ 
      userId: user.id, 
      action: "REGISTER", 
      entityType: "user", 
      entityId: user.id 
    });

    return NextResponse.json({ 
      success: true,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role 
      } 
    }, { status: 201 });
    
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ 
      error: "Internal server error: " + (error as Error).message 
    }, { status: 500 });
  }
}