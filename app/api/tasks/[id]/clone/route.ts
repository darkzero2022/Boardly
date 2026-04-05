import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function getIO() {
  try {
    return (
      ((globalThis as Record<string, unknown>).__socketio as import("socket.io").Server) ?? null
    );
  } catch {
    return null;
  }
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

  // Fetch original task with labels
  const original = await prisma.task.findUnique({
    where: { id: taskId },
    include: { labels: true },
  });

  if (!original) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // Create new task as a clone
  const cloned = await prisma.task.create({
    data: {
      title: `${original.title} (copy)`,
      description: original.description,
      boardId: original.boardId,
      columnId: original.columnId,
      priority: original.priority,
      assigneeId: original.assigneeId,
      reporterId: original.reporterId,
      order: original.order,
    },
  });

  // Copy all TaskLabel records (SQLite does not support skipDuplicates)
  for (const l of original.labels) {
    await prisma.taskLabel.upsert({
      where: { taskId_labelId: { taskId: cloned.id, labelId: l.labelId } },
      create: { taskId: cloned.id, labelId: l.labelId },
      update: {},
    });
  }

  // Create AuditLog entry
  await prisma.auditLog.create({
    data: {
      taskId: cloned.id,
      userId,
      action: "CLONED",
      newValue: original.id,
    },
  });

  // Fetch cloned task with labels to return full data
  const clonedWithLabels = await prisma.task.findUnique({
    where: { id: cloned.id },
    include: {
      labels: { include: { label: true } },
      column: true,
      board: true,
    },
  });

  // Emit socket event
  try {
    const io = getIO();
    io?.to(`board:${original.boardId}`).emit("task:created", {
      taskId: cloned.id,
    });
  } catch {
    // socket may not be available during testing
  }

  return NextResponse.json(clonedWithLabels, { status: 201 });
}
