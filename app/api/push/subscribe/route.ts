import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { registerPushSubscription } from "@/lib/notifications/push";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await req.json();
  registerPushSubscription(session.user.id, subscription);

  return NextResponse.json({ success: true });
}
