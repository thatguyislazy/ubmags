import { prisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email";

const appName = process.env.APP_NAME || "MAGS";
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function emailUserOnDecision(params: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { email: true, name: true },
  });

  if (!user) return;

  const linkBlock = params.link
    ? `<p><a href="${baseUrl}${params.link}">${appName} — open request</a></p>`
    : "";

  const html = `
    <div style="font-family:sans-serif;line-height:1.5;max-width:520px">
      <p>Hello ${escapeHtml(user.name)},</p>
      <p>${escapeHtml(params.message)}</p>
      ${linkBlock}
      <p style="color:#666;font-size:12px">— ${escapeHtml(appName)} (automated message)</p>
    </div>
  `.trim();

  await sendTransactionalEmail({
    to: user.email,
    subject: `${params.title} — ${appName}`,
    html,
    text: `${params.message}\n${params.link ? `${baseUrl}${params.link}` : ""}`,
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
