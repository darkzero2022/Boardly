import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createHmac } from "crypto";
import { isSafeWebhookUrl } from "@/lib/notifications/dispatcher";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const webhook = await prisma.webhook.findUnique({ where: { id: params.id } });
  if (!webhook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isSafeWebhookUrl(webhook.url)) {
    return NextResponse.json({ error: "Webhook URL is not allowed (private/internal addresses are blocked)" }, { status: 400 });
  }
  // Test button enforces HTTPS in production; saved webhooks allow HTTP for self-hosted setups
  if (process.env.NODE_ENV === "production" && !/^https:\/\//i.test(webhook.url)) {
    return NextResponse.json({ error: "Webhook URL must use HTTPS in production" }, { status: 400 });
  }

  const payload = {
    event: "webhook.test",
    payload: { message: "This is a test event from Boardly" },
    timestamp: new Date().toISOString(),
  };
  const body = JSON.stringify(payload);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (webhook.secret) {
    headers["X-Boardly-Signature"] = createHmac("sha256", webhook.secret).update(body).digest("hex");
  }

  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(10_000), // 10-second timeout
    });
    return NextResponse.json({ ok: true, status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reach URL";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
