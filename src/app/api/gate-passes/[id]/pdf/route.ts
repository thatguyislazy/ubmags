import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateGatePassPdf } from "@/lib/pdf/gate-pass";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const gatePass = await prisma.gatePass.findUnique({ where: { id } });
  if (!gatePass) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (gatePass.userId !== session.id && !["ADMIN", "MAGS_OFFICER", "STAFF"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (gatePass.status !== "APPROVED") {
    return NextResponse.json({ error: "Gate pass must be approved before printing" }, { status: 400 });
  }

  const doc = await generateGatePassPdf(gatePass);
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="gate-pass-${gatePass.passNumber}.pdf"`,
    },
  });
}
