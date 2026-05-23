/**
 * Optional SMTP email delivery. When SMTP env vars are unset, logs in dev only (no throw).
 */
export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.EMAIL_FROM
  );
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const { to, subject, html, text } = params;

  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[MAGS Email] (SMTP not configured — would send to ${to})\nSubject: ${subject}\n${text ?? html.slice(0, 500)}...`
      );
    }
    return { sent: false };
  }

  try {
    const nodemailer = await import("nodemailer");
    const port = Number(process.env.SMTP_PORT ?? "587");
    const secure = process.env.SMTP_SECURE === "true";

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text ?? stripHtml(html),
    });

    return { sent: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Email send failed";
    console.error("[MAGS Email]", message);
    return { sent: false, error: message };
  }
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
