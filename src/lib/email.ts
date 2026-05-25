import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const appName = process.env.APP_NAME || "MAGS";
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const { to, subject, html } = params;

  if (!isEmailConfigured()) {
    console.log(`[MAGS Email] ⚠️ RESEND_API_KEY not configured — would send to ${to}`);
    return { sent: false, error: "Resend not configured" };
  }

  try {
    console.log(`[MAGS Email] 📧 Attempting to send to: ${to}`);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || `${appName} <onboarding@resend.dev>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[MAGS Email] ❌ Resend error:", error);
      return { sent: false, error: error.message };
    }

    console.log(`[MAGS Email] ✅ Email sent successfully to ${to}`);
    return { sent: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Email send failed";
    console.error("[MAGS Email] ❌❌❌ ERROR:", message);
    return { sent: false, error: message };
  }
}

// ============ RESERVATION EMAIL FUNCTIONS ============

function getReservationEmailTemplate(status: string, reservation: any) {
  const templates: Record<string, { subject: string; color: string; message: string }> = {
    PENDING_DEPT: {
      subject: "📋 Reservation Submitted - Pending Approval",
      color: "#f59e0b",
      message: "Your reservation has been submitted and is now waiting for department approval.",
    },
    SEMI_APPROVED: {
      subject: "✅ Reservation Semi-Approved",
      color: "#3b82f6",
      message: "Your reservation has been approved by your department. It is now waiting for MAGS approval.",
    },
    APPROVED: {
      subject: "🎉 Reservation Approved!",
      color: "#10b981",
      message: "Congratulations! Your reservation has been fully approved by MAGS.",
    },
    DECLINED: {
      subject: "❌ Reservation Declined",
      color: "#ef4444",
      message: "We regret to inform you that your reservation has been declined.",
    },
    CANCELLED: {
      subject: "🗑️ Reservation Cancelled",
      color: "#6b7280",
      message: "Your reservation has been cancelled.",
    },
  };

  const info = templates[status] || {
    subject: `Reservation Update - ${status}`,
    color: "#6b7280",
    message: "Your reservation status has been updated.",
  };

  const hasEquipment = reservation.equipment?.length > 0;
  const hasVenues = reservation.venues?.length > 0;
  const reservationType = hasEquipment ? "Equipment" : hasVenues ? "Venue" : "Resource";

  let itemsList = "";
  if (hasEquipment && reservation.equipment) {
    itemsList = reservation.equipment
      .map((e: any) => `<li>${e.resource.name} - Quantity: ${e.quantity}</li>`)
      .join("");
  } else if (hasVenues && reservation.venues) {
    itemsList = reservation.venues
      .map((v: any) => `<li>${v.resource.name}${v.specifyText ? ` (${v.specifyText})` : ""}</li>`)
      .join("");
  }

  const rejectionBlock = reservation.rejectionReason
    ? `<p><strong>Reason:</strong> ${reservation.rejectionReason}</p>`
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${info.color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .status { display: inline-block; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; background-color: ${info.color}20; color: ${info.color}; }
        .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; }
        .button { background-color: ${info.color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>MAGS Resource Management System</h2>
          <p>${reservationType} Reservation Update</p>
        </div>
        <div class="content">
          <p>Dear <strong>${reservation.user?.name || "Valued User"}</strong>,</p>
          <p>${info.message}</p>
          <div class="details">
            <h3>Reservation Details:</h3>
            <p><strong>Request Number:</strong> ${reservation.requestNumber}</p>
            <p><strong>Event Title:</strong> ${reservation.eventTitle}</p>
            <p><strong>Schedule:</strong> ${new Date(reservation.startDateTime).toLocaleString()} - ${new Date(reservation.endDateTime).toLocaleString()}</p>
            <p><strong>Campus:</strong> ${reservation.campus}</p>
            <p><strong>Department:</strong> ${reservation.department?.name || "N/A"}</p>
            ${itemsList ? `<p><strong>Items Requested:</strong></p><ul>${itemsList}</ul>` : ""}
            ${rejectionBlock}
            <p><strong>Status:</strong> <span class="status">${status.replace(/_/g, " ")}</span></p>
          </div>
          <p style="text-align: center;">
            <a href="${baseUrl}/reservations/${reservation.id}" class="button">
              View Reservation
            </a>
          </p>
          <p>Thank you for using the MAGS Resource Management System!</p>
        </div>
        <div class="footer">
          <p>This is an automated message from MAGS Resource Management System - UBLC</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `${info.message}\n\nRequest Number: ${reservation.requestNumber}\nEvent Title: ${reservation.eventTitle}\nSchedule: ${new Date(reservation.startDateTime).toLocaleString()} - ${new Date(reservation.endDateTime).toLocaleString()}\nStatus: ${status.replace(/_/g, " ")}\n\nView your reservation: ${baseUrl}/reservations/${reservation.id}`;

  return { subject: info.subject, html, text };
}

export async function sendReservationStatusEmail(
  to: string,
  name: string,
  status: string,
  reservation: any
): Promise<{ sent: boolean; error?: string }> {
  console.log(`[MAGS Email] 🔔 sendReservationStatusEmail called`);
  console.log(`[MAGS Email] Recipient: ${to}, Status: ${status}`);

  if (!to || !to.includes("@")) {
    console.log(`[MAGS Email] ❌ No valid email: ${to}`);
    return { sent: false, error: "No valid email" };
  }

  const { subject, html, text } = getReservationEmailTemplate(status, reservation);

  return sendTransactionalEmail({ to, subject, html, text });
}
