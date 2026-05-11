import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { authenticator } from "otplib";
import QRCode from "qrcode";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(session.user.email ?? session.user.name ?? "user", "Boardly", secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);

  return NextResponse.json({ secret, qrDataUrl });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { secret, token } = await req.json() as { secret: string; token: string };

  if (!secret || !token) return NextResponse.json({ error: "secret and token required" }, { status: 400 });

  const valid = authenticator.verify({ token, secret });
  if (!valid) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: secret, totpEnabled: true },
  });

  return NextResponse.json({ ok: true });
}
