import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verify } from "otplib";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fallback");

// Called during login when 2FA is required.
// Requires a valid `boardly_2fa_pending` cookie (issued by /api/auth/totp/check
// after a successful password check) to prevent unauthenticated brute-forcing.
export async function POST(req: NextRequest) {
  // Validate the pending-2FA cookie (proves password was already verified)
  const pendingCookie = req.cookies.get("boardly_2fa_pending")?.value;
  if (!pendingCookie) {
    return NextResponse.json({ error: "No pending authentication session" }, { status: 401 });
  }

  let pendingEmail: string;
  try {
    const { payload } = await jwtVerify(pendingCookie, secret);
    pendingEmail = payload.email as string;
  } catch {
    return NextResponse.json({ error: "Pending session expired — please sign in again" }, { status: 401 });
  }

  const { email, token } = await req.json() as { email: string; token: string };

  // Ensure the submitted email matches the one in the signed cookie
  if (!email || !token || email !== pendingEmail) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { totpSecret: true, totpEnabled: true },
  });

  if (!user?.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: "2FA not enabled for this user" }, { status: 400 });
  }

  const result = await verify({ token, secret: user.totpSecret });
  const valid = typeof result === "object" ? result.valid : result;
  if (!valid) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  // Clear the pending cookie on success
  const res = NextResponse.json({ ok: true });
  res.cookies.set("boardly_2fa_pending", "", { maxAge: 0, path: "/" });
  return res;
}
