import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verify } from "otplib";

// Called during login when 2FA is required
// The pending user email is passed in body; no session yet
export async function POST(req: NextRequest) {
  const { email, token } = await req.json() as { email: string; token: string };

  if (!email || !token) return NextResponse.json({ error: "email and token required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, totpSecret: true, totpEnabled: true } });

  if (!user?.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: "2FA not enabled for this user" }, { status: 400 });
  }

  const result = await verify({ token, secret: user.totpSecret });
  const valid = typeof result === "object" ? result.valid : result;
  if (!valid) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  return NextResponse.json({ ok: true, userId: user.id });
}
