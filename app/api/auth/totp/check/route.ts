import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Public endpoint: check if credentials are valid AND user has 2FA enabled
// Returns { requires2FA: boolean } — does NOT create a session
export async function POST(req: NextRequest) {
  const { email, password } = await req.json() as { email: string; password: string };

  if (!email || !password) return NextResponse.json({ requires2FA: false });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { passwordHash: true, totpEnabled: true },
  });

  if (!user?.passwordHash) return NextResponse.json({ requires2FA: false });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return NextResponse.json({ requires2FA: false });

  return NextResponse.json({ requires2FA: user.totpEnabled });
}
