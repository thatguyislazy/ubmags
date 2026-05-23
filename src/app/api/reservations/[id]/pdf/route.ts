import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatDateTime } from "@/lib/utils";
import fs from "fs";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const copyType = searchParams.get("copy") || "MAGS copy";

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        department: true,
        user: true,
        venues: { include: { resource: true } },
        equipment: { include: { resource: true } },
        services: { include: { resource: true } },
        approvals: {
          orderBy: { level: "asc" },
          include: { approver: true },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const hasVenues = reservation.venues.length > 0;
    const hasEquipment = reservation.equipment.length > 0;

    let templatePath = "";
    let isEquipmentReservation = false;

    if (hasEquipment) {
      templatePath = path.join(
        process.cwd(),
        "public",
        "templates",
        "equipment copy.pdf"
      );
      isEquipmentReservation = true;
    } else if (hasVenues) {
      templatePath = path.join(
        process.cwd(),
        "public",
        "templates",
        "venue copy.pdf"
      );
    } else {
      return NextResponse.json(
        { error: "No template found for this reservation" },
        { status: 404 }
      );
    }

    if (!fs.existsSync(templatePath)) {
      console.error("Template not found:", templatePath);
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const { width, height } = firstPage.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const drawText = (
      text: string,
      x: number,
      y: number,
      options?: {
        size?: number;
        isBold?: boolean;
        color?: any;
        maxWidth?: number;
      }
    ) => {
      if (!text || text.trim() === "") return;

      let displayText = text;
      if (options?.maxWidth && text.length > options.maxWidth) {
        displayText = text.substring(0, options.maxWidth - 3) + "...";
      }

      firstPage.drawText(displayText, {
        x,
        y,
        size: options?.size ?? 10,
        font: options?.isBold ? boldFont : font,
        color: options?.color ?? rgb(0, 0, 0),
      });
    };

    if (isEquipmentReservation) {
      // ============ EQUIPMENT PDF FILLING ============

      const copyTags: Record<string, string> = {
        "MAGS copy": "[MAGS - Copy]",
        "BMD's copy": "[BMD - Copy]",
        "Security's copy": "[SECURITY - Copy]",
      };
      const copyTag = copyTags[copyType] || "[MAGS - Copy]";

      drawText(copyTag, 100, 500, {
        size: 12,
        isBold: true,
        color: rgb(0.5, 0, 0),
      });

      drawText(
        new Date(reservation.filingDate).toLocaleDateString(),
        560,
        height - 185,
        { size: 10 }
      );

      drawText(reservation.department?.name || "", 115, height - 208);

      drawText(reservation.campus || "Lipa", 480, height - 212, { size: 10 });

      drawText(reservation.eventTitle || "", 130, height - 237, { size: 10 });

      drawText(
        `${formatDateTime(reservation.startDateTime)} — ${formatDateTime(
          reservation.endDateTime
        )}`,
        480,
        height - 235,
        { size: 9 }
      );

      drawText(reservation.user.name, 180, height - 380, { size: 11 });

      drawText("Equipment:", 150, height - 260, { size: 11, isBold: true });

      if (reservation.equipment.length > 0) {
        const startY = height - 285;
        const column1X = 170;
        const column2X = 350;
        const column3X = 530;
        const lineHeight = 22;

        const itemsPerColumn = Math.ceil(reservation.equipment.length / 3);
        const column1Items = reservation.equipment.slice(0, itemsPerColumn);
        const column2Items = reservation.equipment.slice(
          itemsPerColumn,
          itemsPerColumn * 2
        );
        const column3Items = reservation.equipment.slice(itemsPerColumn * 2);

        let col1Y = startY;
        for (const item of column1Items) {
          drawText(`- ${item.resource.name} - ${item.quantity}`, column1X, col1Y);
          col1Y -= lineHeight;
        }

        let col2Y = startY;
        for (const item of column2Items) {
          drawText(`- ${item.resource.name} - ${item.quantity}`, column2X, col2Y);
          col2Y -= lineHeight;
        }

        let col3Y = startY;
        for (const item of column3Items) {
          drawText(`- ${item.resource.name} - ${item.quantity}`, column3X, col3Y);
          col3Y -= lineHeight;
        }
      } else {
        drawText("- No equipment requested", 170, height - 285, {
          size: 9,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    } else {
      // ============ VENUE PDF FILLING ============
      // Page size: 792 x 612 pts (Letter landscape)
      // Coordinates measured from actual template using pdfplumber.
      // pdf-lib origin is bottom-left; formula: y = 612 - pdfplumber_top

      const checkedVenues = reservation.venues.map((v) => v.resource.name);

      // ===== COPY TYPE TAG =====
      // Overlays the existing "(BMD's copy)" watermark text at top-left
      const venueCopyTags: Record<string, string> = {
        "MAGS copy": "[MAGS Copy]",
        "BMD's copy": "[BMD Copy]",
        "Security's copy": "[Security Copy]",
      };
      const venueCopyTag = venueCopyTags[copyType] || "[MAGS Copy]";

      drawText(venueCopyTag, 90, 577, {
        size: 10,
        isBold: true,
        color: rgb(0.5, 0, 0),
      });

      // ===== DATE OF FILING =====
      // Underline starts after "Date of filing:" label (label ends ~x558)
      drawText(
        new Date(reservation.filingDate).toLocaleDateString("en-PH"),
        560,
        472,
        { size: 10 }
      );

      // ===== OFFICE / DEPARTMENT =====
      // Underline starts after "Office/Department:" label (label ends ~x192)
      drawText(reservation.department?.name || "", 195, 442, { size: 10 });

      // ===== CAMPUS =====
      // Underline starts after "Campus:" label (label ends ~x454)
      drawText(reservation.campus || "Lipa", 520, 442, { size: 10 });

      // ===== EVENT =====
      // Underline starts after "Event:" label (label ends ~x122)
      drawText(reservation.eventTitle || "", 125, 422, {
        size: 10,
        maxWidth: 40,
      });

      // ===== DATE & TIME =====
      // Underline starts after "Time:" label (label ends ~x476)
      drawText(
        `${formatDateTime(reservation.startDateTime)} — ${formatDateTime(
          reservation.endDateTime
        )}`,
        478,
        422,
        { size: 9 }
      );

      // ===== CHECKBOXES =====
      // "X" is drawn at the left edge of each □ checkbox.
      // Coordinates are the x0 of the □ glyph (just before the label text).
      // Venue name keys must match resource.name values in your DB exactly.
      const venueCheckboxes: Record<string, { x: number; y: number }> = {
        // Left column
        "Auditorium":               { x: 91, y: 397 },
        "CAB Conference Room":      { x: 91, y: 382 },
        "Learning Resource Center": { x: 91, y: 365 },
        "Conference Room":          { x: 91, y: 350 },
        // Middle column
        "Gymnasium":                { x: 333, y: 397 },
        "Function Hall":            { x: 333, y: 382 },
        "Air conditioned rooms":    { x: 333, y: 368 },
        // Right column
        "Multi Media Center":       { x: 537, y: 397 },
        "UB Chapel":                { x: 537, y: 382 },
        // "Others" is handled separately below
      };

      for (const [venueName, pos] of Object.entries(venueCheckboxes)) {
        const isSelected = checkedVenues.some(
          (v) =>
            v.toLowerCase().includes(venueName.toLowerCase()) ||
            venueName.toLowerCase().includes(v.toLowerCase())
        );

        if (isSelected) {
          drawText("X", pos.x, pos.y, {
            size: 10,
            isBold: true,
            color: rgb(0, 0, 0),
          });
        }
      }

      // ===== "OTHERS" CHECKBOX + SPECIFY TEXT =====
      // "Others:" label is at x≈531; checkbox □ is just left of it
      if (reservation.customVenueSpecify) {
        drawText("X", 537, 368, {
          size: 10,
          isBold: true,
          color: rgb(0, 0, 0),
        });
        // Write specify text right after the "Others: ___" underline
        drawText(reservation.customVenueSpecify, 575, 368, { size: 9 });
      }

      // ===== LEFT COLUMN "Specify:" (below Conference Room row) =====
      // This line is for any left-column venue that needs a specify note
      const leftSpecifyVenue = reservation.venues.find(
        (v) =>
          v.resource.name.toLowerCase().includes("conference room") &&
          (v as any).specifyText
      );
      if (leftSpecifyVenue && (leftSpecifyVenue as any).specifyText) {
        drawText((leftSpecifyVenue as any).specifyText, 135, 340, { size: 9 });
      }

      // ===== MIDDLE COLUMN "Specify:" (Air conditioned rooms) =====
      // "Specify:" underline in middle column starts at ~x378
      const airconVenue = reservation.venues.find((v) =>
        v.resource.name.toLowerCase().includes("air conditioned")
      );
      if (airconVenue && (airconVenue as any).specifyText) {
        drawText((airconVenue as any).specifyText, 378, 354, { size: 9 });
      }

      // ===== NOTE: items / personnel needed =====
      // Written on the blank line below the "Note: Please list..." label
      if (reservation.itemsPersonnelNote) {
        drawText(reservation.itemsPersonnelNote, 88, 297, {
          size: 9,
          maxWidth: 100,
        });
      }

      // ===== REQUESTED BY =====
      // Written above the "Signature over Printed Name" sub-label
      const conformeName =
        reservation.conformeName || reservation.user?.name || "";
      drawText(conformeName, 170, 282, { size: 10, isBold: true });
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${copyType.replace(
          /'/g,
          ""
        )}-${reservation.requestNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF: " + (error as Error).message },
      { status: 500 }
    );
  }
}