import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; logId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const log = await prisma.timeLog.findUnique({ where: { id: params.logId } });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = log.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.timeLog.delete({ where: { id: params.logId } });
  return new NextResponse(null, { status: 204 });
}
