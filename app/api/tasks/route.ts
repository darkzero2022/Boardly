import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assignSLADeadline } from "@/lib/sla/engine";
import { logAudit } from "@/lib/audit/middleware";
import { dispatch, dispatchWebhooks } from "@/lib/notifications/dispatcher";
import { parseMentions } from "@/lib/utils";
import { pushTaskToPlanner } from "@/lib/integrations/planner/sync";
import { sendTaskCard } from "@/lib/integrations/teams/webhook";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  boardId: z.string(),
  columnId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional().default("MEDIUM"),
  dueDate: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  parentTaskId: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");

  const tasks = await prisma.task.findMany({
    where: {
      boardId: boardId ?? undefined,
      assigneeId: searchParams.get("assigneeId") ?? undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      labels: { include: { label: true } },
      column: true,
      board: true,
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, boardId, columnId, assigneeId, priority, dueDate, labelIds, parentTaskId, isRecurring, recurrenceRule } = parsed.data;

  // Get column — use first column if not specified
  let targetColumnId = columnId;
  if (!targetColumnId && !parentTaskId) {
    const firstCol = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: "asc" },
    });
    if (!firstCol) return NextResponse.json({ error: "No columns on board" }, { status: 400 });
    targetColumnId = firstCol.id;
  }

  // Get max order
  const maxOrder = await prisma.task.aggregate({
    where: { columnId: targetColumnId ?? undefined },
    _max: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      title,
      description,
      boardId,
      columnId: targetColumnId ?? (await prisma.column.findFirst({ where: { boardId }, orderBy: { order: "asc" } }))!.id,
      assigneeId: assigneeId || null,
      reporterId: session.user.id,
      priority: priority as never,
      dueDate: dueDate ? new Date(dueDate) : null,
      order: (maxOrder._max.order ?? 0) + 1,
      parentTaskId: parentTaskId || null,
      isRecurring: isRecurring ?? false,
      recurrenceRule: recurrenceRule || null,
      ...(labelIds?.length
        ? { labels: { create: labelIds.map((id) => ({ labelId: id })) } }
        : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      labels: { include: { label: true } },
      _count: { select: { subtasks: true, comments: true, attachments: true } },
    },
  });

  // Assign SLA deadline
  await assignSLADeadline(task.id, priority as never, boardId);

  // Audit log
  await logAudit({
    taskId: task.id,
    userId: session.user.id,
    action: "CREATED",
    newValue: title,
  });

  // Notify assignee
  if (assigneeId && assigneeId !== session.user.id) {
    await dispatch({
      userId: assigneeId,
      type: "TASK_ASSIGNED",
      message: `You have been assigned to: "${title}"`,
      link: `/boards/${boardId}?task=${task.id}`,
      taskId: task.id,
    });
  }

  // Process @mentions in description
  if (description) {
    const mentions = parseMentions(description);
    const mentionedUsers = await prisma.user.findMany({
      where: { name: { in: mentions } },
      select: { id: true },
    });
    await Promise.all(
      mentionedUsers
        .filter((u) => u.id !== session.user!.id)
        .map((u) =>
          dispatch({
            userId: u.id,
            type: "COMMENT_MENTION",
            message: `You were mentioned in task: "${title}"`,
            link: `/boards/${boardId}?task=${task.id}`,
            taskId: task.id,
          })
        )
    );
  }

  // Emit Socket.io event
  const io = (globalThis as Record<string, unknown>).__socketio as import("socket.io").Server | undefined;
  if (io) {
    io.to(`board:${boardId}`).emit("task:created", task);
  }

  // Outbound webhooks (fire-and-forget)
  dispatchWebhooks("task.created", { task: { id: task.id, title: task.title, priority: task.priority, boardId } }, boardId);

  // MS Planner sync (background)
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (board?.plannerPlanId) {
    pushTaskToPlanner(task.id).catch(console.error);
  }

  // Teams notification (background)
  if (board?.teamsWebhook) {
    sendTaskCard(board.teamsWebhook, {
      id: task.id,
      title: task.title,
      priority: task.priority,
      assignee: task.assignee,
      slaStatus: task.slaStatus,
      board: { id: boardId, name: board.name },
    }, "CREATED").catch(console.error);
  }

  return NextResponse.json(task, { status: 201 });
}
