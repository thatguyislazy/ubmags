import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Reservation, Department, User, ReservationVenue, Resource } from "@prisma/client";

type ReservationWithRelations = Reservation & {
  department: Department;
  user: User;
  venues: (ReservationVenue & { resource: Resource })[];
};

const MAGS_OFFICER = "Editha E. Sevilleja";

export function generateVenueReservationPdf(
  reservation: ReservationWithRelations,
  copyLabel: "MAGS copy" | "BMD's copy" | "Security's copy"
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(10);
  doc.setTextColor(139, 0, 0);
  doc.text("UNIVERSITY OF BATANGAS", pageWidth / 2, 15, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text("Management of Assets and General Services", pageWidth / 2, 21, { align: "center" });
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text("VENUE RESERVATION", pageWidth / 2, 30, { align: "center" });
  doc.setFontSize(8);
  doc.text(`(${copyLabel})`, pageWidth / 2, 36, { align: "center" });

  let y = 44;
  doc.setFontSize(10);
  doc.text(`Date of filing: ${new Date(reservation.filingDate).toLocaleDateString("en-PH")}`, 14, y);
  y += 8;
  doc.text(`Office/Department: ${reservation.department.name}`, 14, y);
  doc.text(`Campus: ${reservation.campus}`, 110, y);
  y += 8;
  doc.text(`Event: ${reservation.eventTitle}`, 14, y);
  y += 8;
  doc.text(
    `Date & Time: ${new Date(reservation.startDateTime).toLocaleString("en-PH")} - ${new Date(reservation.endDateTime).toLocaleString("en-PH")}`,
    14,
    y
  );
  y += 12;

  const venueNames = reservation.venues.map((v) =>
    v.specifyText ? `${v.resource.name} (${v.specifyText})` : v.resource.name
  );
  if (reservation.customVenueSpecify) {
    venueNames.push(`Others: ${reservation.customVenueSpecify}`);
  }

  autoTable(doc, {
    startY: y,
    head: [["Venue / Facility"]],
    body: venueNames.map((n) => [n]),
    theme: "grid",
    headStyles: { fillColor: [139, 0, 0] },
    margin: { left: 14, right: 14 },
  });

  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;

  if (reservation.itemsPersonnelNote) {
    doc.text("Note: List of items/personnel needed:", 14, y);
    y += 6;
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(reservation.itemsPersonnelNote, pageWidth - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 8;
  }

  doc.setFontSize(10);
  doc.text(`Requested by: ${reservation.user.name}`, 14, y + 20);
  doc.text("Signature over Printed Name", 14, y + 26);
  doc.text(`Approved by: ${MAGS_OFFICER}`, 110, y + 20);
  doc.text("MAGS Officer", 110, y + 26);

  y += 50;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("REMINDERS", 14, y);
  doc.setFont("helvetica", "normal");
  const reminders = [
    '1. Approval for the use will be based on "First Come, First Serve" basis.',
    "2. MAGS Office must be informed of postponement/cancellation at least 2 days before the activity.",
    "3. User must observe orderliness and cleanliness of the area.",
    "4. User must return all equipment where they belong.",
  ];
  reminders.forEach((r, i) => {
    doc.text(r, 14, y + 8 + i * 6, { maxWidth: pageWidth - 28 });
  });

  y += 40;
  doc.text("Conforme:", 14, y);
  doc.text(reservation.conformeName || "_________________________", 14, y + 8);
  doc.text("Chief of Office/Representative", 14, y + 14);
  doc.text(
    reservation.conformeDate
      ? new Date(reservation.conformeDate).toLocaleDateString("en-PH")
      : "_____________",
    110,
    y + 8
  );
  doc.text("Date", 110, y + 14);

  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text("F-MAGS LC-10 | Revision No.: 2 | Issue Date: January 25, 2023", 14, 285);

  return doc;
}
