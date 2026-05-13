import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createHmac } from "crypto";

/** Block private / loopback / link-local IP ranges to prevent SSRF. */
function isSafeWebhookUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    // Only allow https in production; allow http in development
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return false;
    if (!["http:", "https:"].includes(url.protocol)) return false;

    const host = url.hostname.toLowerCase();
    // Block localhost and loopback
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return false;
    // Block link-local (169.254.x.x)
    if (/^169\.254\./.test(host)) return false;
    // Block RFC-1918 private ranges
    if (/^10\./.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    if (/^192\.168\./.test(host)) return false;
    // Block AWS metadata endpoint
    if (host === "169.254.169.254") return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const webhook = await prisma.webhook.findUnique({ where: { id: params.id } });
  if (!webhook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isSafeWebhookUrl(webhook.url)) {
    return NextResponse.json({ error: "Webhook URL is not allowed (private/internal addresses are blocked)" }, { status: 400 });
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
