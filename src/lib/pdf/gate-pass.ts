import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { GatePass } from "@prisma/client";

const MAGS_OFFICER = "Editha E. Sevilleja";

export async function generateGatePassPdf(
  gatePass: GatePass & { qrCodeData?: string | null }
) {
  const doc = new jsPDF({ format: "a5", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(10);
  doc.setTextColor(139, 0, 0);
  doc.text("UNIVERSITY OF BATANGAS", pageWidth / 2, 12, { align: "center" });
  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.text("GATE PASS", pageWidth / 2, 22, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Pass No.: ${gatePass.passNumber}`, pageWidth / 2, 28, { align: "center" });

  let y = 36;
  const fields: [string, string][] = [
    ["Date Filed:", new Date(gatePass.dateFiled).toLocaleDateString("en-PH")],
    ["Name:", gatePass.requestorName],
    ["Course:", gatePass.course || "—"],
    ["SN:", gatePass.studentNumber || "—"],
    ["Type / Kind of Equipment:", gatePass.equipmentType],
    ["Description:", gatePass.equipmentDescription || "—"],
    ["Brand:", gatePass.brand || "—"],
    ["Serial No.:", gatePass.serialNumber || "—"],
    ["Model:", gatePass.model || "—"],
    ["Purpose:", gatePass.purpose],
    [
      "Date/Time of Entry:",
      new Date(gatePass.entryDateTime).toLocaleString("en-PH"),
    ],
    [
      "Date/Time of Pull-Out:",
      new Date(gatePass.pullOutDateTime).toLocaleString("en-PH"),
    ],
  ];

  doc.setFontSize(9);
  fields.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 10, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, pageWidth - 70);
    doc.text(lines, 58, y);
    y += Math.max(6, lines.length * 5);
  });

  if (gatePass.qrCodeData) {
    try {
      const qrDataUrl = await QRCode.toDataURL(gatePass.qrCodeData, { width: 80 });
      doc.addImage(qrDataUrl, "PNG", pageWidth - 35, 35, 28, 28);
    } catch {
      // QR optional
    }
  }

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Approved by:", 10, y);
  doc.setFont("helvetica", "normal");
  doc.text(gatePass.approvedByName || MAGS_OFFICER, 10, y + 6);
  doc.text("MAGS Officer", 10, y + 12);

  if (gatePass.status === "APPROVED" && gatePass.approvedAt) {
    doc.setFontSize(8);
    doc.text(
      `Approved: ${new Date(gatePass.approvedAt).toLocaleString("en-PH")}`,
      10,
      y + 18
    );
  }

  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text("F-MAGS LC-06 | Revision No.: 1 | Issue Date: February 29, 2024", 10, 140);

  return doc;
}
