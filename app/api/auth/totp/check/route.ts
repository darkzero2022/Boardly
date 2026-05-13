import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fallback");

// Public endpoint: validate credentials and signal if 2FA is required.
// On success + requires2FA, issues a short-lived signed cookie so the
// TOTP verify endpoint can confirm the caller already passed password auth.
export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email: string; password: string };

  if (!email || !password) return NextResponse.json({ requires2FA: false });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, totpEnabled: true },
  });

  // Always run bcrypt to prevent timing-based user enumeration
  const dummyHash = "$2a$10$dummydummydummydummydummydummydummydummydummydummydumm";
  const valid = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);
  if (!user || !valid) return NextResponse.json({ requires2FA: false });

  if (!user.totpEnabled) return NextResponse.json({ requires2FA: false });

  // Issue a 5-minute signed JWT stored in an HttpOnly cookie as proof the
  // caller passed password auth — the TOTP verify endpoint checks this.
  const pendingToken = await new SignJWT({ email, sub: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);

  const res = NextResponse.json({ requires2FA: true });
  res.cookies.set("boardly_2fa_pending", pendingToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 minutes
    path: "/",
  });
  return res;
}
