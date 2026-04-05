import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function getTransporter() {
  const config = await prisma.globalNotifConfig.findUnique({
    where: { id: "global" },
  });

  if (!config?.smtpHost) {
    // Fallback to env vars
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort ?? 587,
    auth: {
      user: config.smtpUser ?? undefined,
      pass: config.smtpPass ?? undefined,
    },
  });
}

export async function sendEmail(payload: EmailPayload) {
  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "Boardly <noreply@boardly.local>",
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  } catch (err) {
    console.error("[Email] Failed to send:", err);
  }
}
