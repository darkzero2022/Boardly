import { NextRequest, NextResponse } from "next/server";
import { pullTaskFromPlanner } from "@/lib/integrations/planner/sync";

/**
 * Microsoft Graph change notification webhook for Planner tasks.
 * Registration: POST /subscriptions on Graph API.
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Graph API validation handshake
  const validationToken = searchParams.get("validationToken");
  if (validationToken) {
    return new NextResponse(validationToken, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  try {
    const body = await req.json();
    const notifications = body.value ?? [];

    for (const notif of notifications) {
      if (notif.resourceData?.id) {
        await pullTaskFromPlanner(notif.resourceData.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Planner Webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
