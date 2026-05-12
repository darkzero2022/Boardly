import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
  taskTitle?: string;
  taskLink?: string;
  actionLabel?: string;
}

async function getTransporter() {
  const config = await prisma.globalNotifConfig.findUnique({ where: { id: "global" } });

  const host = config?.smtpHost || process.env.SMTP_HOST;
  const port = config?.smtpPort ?? parseInt(process.env.SMTP_PORT || "587");
  const user = config?.smtpUser || process.env.SMTP_USER;
  const pass = config?.smtpPass || process.env.SMTP_PASS;

  return nodemailer.createTransport({ host, port, auth: user ? { user, pass: pass ?? undefined } : undefined });
}

function buildHtml(payload: EmailPayload): string {
  const { subject, text, taskTitle, taskLink, actionLabel = "View Task" } = payload;
  const base = process.env.NEXTAUTH_URL ?? "";
  const fullLink = taskLink ? `${base}${taskLink}` : null;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr><td style="background:#6366f1;padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Boardly</span>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#0f172a;">${subject}</h2>
          ${taskTitle ? `<p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:500;">Task: ${taskTitle}</p>` : ""}
          <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">${text}</p>
          ${fullLink ? `<a href="${fullLink}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 24px;border-radius:8px;">${actionLabel}</a>` : ""}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #f1f5f9;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">You received this because you have notifications enabled in Boardly. <a href="${base}/settings/notifications" style="color:#6366f1;">Manage preferences</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(payload: EmailPayload) {
  try {
    const transporter = await getTransporter();
    const from = process.env.SMTP_FROM ?? "Boardly <noreply@boardly.local>";
    await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html ?? buildHtml(payload),
    });
  } catch (err) {
    console.error("[Email] Failed to send:", err);
  }
}

export async function sendTestEmail(to: string) {
  return sendEmail({
    to,
    subject: "Boardly — Test Email",
    text: "Your email notifications are configured correctly. You will receive alerts here.",
    taskTitle: undefined,
    taskLink: undefined,
    actionLabel: "Open Boardly",
  });
}
