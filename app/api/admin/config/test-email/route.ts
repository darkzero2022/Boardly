import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendTestEmail } from "@/lib/notifications/email";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const email = session.user.email;
  if (!email) return NextResponse.json({ error: "No email on your account" }, { status: 400 });

  await sendTestEmail(email);
  return NextResponse.json({ ok: true, sentTo: email });
}
