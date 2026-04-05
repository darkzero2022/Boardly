import { NextRequest, NextResponse } from "next/server";

/**
 * Incoming webhook from Microsoft Teams (for bot commands).
 */
export async function POST(req: NextRequest) {
  try {
    const activity = await req.json();
    const { handleBotActivity } = await import("@/lib/integrations/teams/bot");
    const response = await handleBotActivity(activity);

    if (response) {
      return NextResponse.json(response);
    }

    return NextResponse.json({ type: "message", text: "" });
  } catch (err) {
    console.error("[Teams Bot] Error:", err);
    return NextResponse.json({ type: "message", text: "An error occurred." });
  }
}
