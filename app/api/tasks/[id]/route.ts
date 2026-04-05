import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logTaskDiff } from "@/lib/audit/middleware";
import { dispatch } from "@/lib/notifications/dispatcher";
import { pushTaskToPlanner } from "@/lib/integrations/planner/sync";
import { sendTaskCard } from "@/lib/integrations/teams/webhook";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      reporter: { select: { id: true, name: true, image: true } },
      labels: { include: { label: true } },
      subtasks: {
        select: { id: true, title: true, slaStatus: true, columnId: true },
        where: { column: { name: { not: { in: ["Done", "Closed"] } } } },
      },
      column: true,
      board: true,
    },
  });

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(task);
}

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
  assigneeId: z.string().nullable().optional(),
  columnId: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const before = await prisma.task.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : parsed.data.dueDate,
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      labels: { include: { label: true } },
      _count: { select: { subtasks: true, comments: true, attachments: true } },
    },
  });

  // Audit diff
  await logTaskDiff(params.id, session.user.id, before as never, updated as never);

  // Assignee notification
  if (parsed.data.assigneeId && parsed.data.assigneeId !== before.assigneeId) {
    await dispatch({
      userId: parsed.data.assigneeId,
      type: "TASK_ASSIGNED",
      message: `You have been assigned to: "${updated.title}"`,
      link: `/boards/${updated.boardId}?task=${updated.id}`,
      taskId: updated.id,
    });
  }

  // Emit socket event
  const io = (globalThis as Record<string, unknown>).__socketio as import("socket.io").Server | undefined;
  if (io) {
    io.to(`board:${updated.boardId}`).emit("task:updated", updated);
  }

  // Planner sync
  const board = await prisma.board.findUnique({ where: { id: updated.boardId } });
  if (board?.plannerPlanId) {
    pushTaskToPlanner(updated.id).catch(console.error);
  }

  // Teams notification for completion
  if (parsed.data.columnId && board?.teamsWebhook) {
    const col = await prisma.column.findUnique({ where: { id: parsed.data.columnId } });
    if (col && ["Done", "Completed", "Closed"].includes(col.name)) {
      sendTaskCard(board.teamsWebhook, {
        id: updated.id,
        title: updated.title,
        priority: updated.priority,
        assignee: updated.assignee,
        slaStatus: updated.slaStatus,
        board: { id: updated.boardId, name: board.name },
      }, "COMPLETED").catch(console.error);
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.task.delete({ where: { id: params.id } });

  const io = (globalThis as Record<string, unknown>).__socketio as import("socket.io").Server | undefined;
  if (io) {
    io.to(`board:${task.boardId}`).emit("task:deleted", { taskId: params.id });
  }

  return NextResponse.json({ success: true });
}
