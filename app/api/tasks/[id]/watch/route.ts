import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const taskId = params.id;

  const [watcher, count] = await Promise.all([
    prisma.taskWatcher.findUnique({
      where: { taskId_userId: { taskId, userId } },
    }),
    prisma.taskWatcher.count({ where: { taskId } }),
  ]);

  return NextResponse.json({ watching: !!watcher, count });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const taskId = params.id;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.taskWatcher.upsert({
    where: { taskId_userId: { taskId, userId } },
    create: { taskId, userId },
    update: {},
  });

  const count = await prisma.taskWatcher.count({ where: { taskId } });

  return NextResponse.json({ watching: true, count });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const taskId = params.id;

  const existing = await prisma.taskWatcher.findUnique({
    where: { taskId_userId: { taskId, userId } },
  });

  if (existing) {
    await prisma.taskWatcher.delete({
      where: { taskId_userId: { taskId, userId } },
    });
  }

  const count = await prisma.taskWatcher.count({ where: { taskId } });

  return NextResponse.json({ watching: false, count });
}
