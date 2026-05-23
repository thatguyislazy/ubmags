import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.passwordReset.create({ data: { email, token, expiresAt } });
      // In production: send email with link /reset-password?token=...
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV] Reset link: /reset-password?token=${token}`);
      }
    }

    return NextResponse.json({
      message: "If an account exists, a reset link has been sent to your email.",
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
