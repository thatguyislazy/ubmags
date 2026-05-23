import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const session = await getSession();
  if (session) {
    await logAudit({ userId: session.id, action: "LOGOUT", entityType: "user", entityId: session.id });
  }
  await destroySession();
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
