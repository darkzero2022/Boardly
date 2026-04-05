import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await prisma.globalNotifConfig.findUnique({ where: { id: "global" } });
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const config = await prisma.globalNotifConfig.upsert({
    where: { id: "global" },
    create: { id: "global", ...body },
    update: body,
  });

  return NextResponse.json(config);
}
