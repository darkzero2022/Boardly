import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.timeLog.findMany({
    where: { taskId: params.id },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { startedAt: "asc" },
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const minutes = parseInt(body.minutes);
  if (!minutes || minutes <= 0) return NextResponse.json({ error: "Invalid minutes" }, { status: 400 });

  const note: string | undefined = body.note || undefined;

  const log = await prisma.timeLog.create({
    data: { taskId: params.id, userId: session.user.id, minutes, note },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  await prisma.auditLog.create({
    data: {
      taskId: params.id,
      userId: session.user.id,
      action: "TIME_LOGGED",
      newValue: `${minutes} min${note ? ": " + note : ""}`,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
