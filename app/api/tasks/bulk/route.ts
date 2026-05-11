import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dispatch } from "@/lib/notifications/dispatcher";

function getIO() {
  try {
    return (
      ((globalThis as Record<string, unknown>).__socketio as import("socket.io").Server) ?? null
    );
  } catch {
    return null;
  }
}

type BulkAction =
  | { type: "move"; payload: { columnId: string } }
  | { type: "assign"; payload: { assigneeId: string } }
  | { type: "label_add"; payload: { labelId: string } }
  | { type: "label_remove"; payload: { labelId: string } }
  | { type: "priority"; payload: { priority: string } }
  | { type: "delete"; payload: Record<string, never> };

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  const { taskIds, action } = body as { taskIds: string[]; action: BulkAction };

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    return NextResponse.json({ error: "taskIds must be a non-empty array" }, { status: 400 });
  }

  if (!action?.type) {
    return NextResponse.json({ error: "action.type is required" }, { status: 400 });
  }

  // Fetch the tasks so we know their boardIds for socket events
  const tasks = await prisma.task.findMany({
    where: { id: { in: taskIds } },
    select: { id: true, boardId: true, title: true, assigneeId: true },
  });

  if (tasks.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  const io = getIO();
  let updated = 0;

  switch (action.type) {
    case "move": {
      const { columnId } = action.payload;

      await prisma.task.updateMany({
        where: { id: { in: taskIds } },
        data: { columnId },
      });

      // Create AuditLog for each task
      await prisma.auditLog.createMany({
        data: tasks.map((t) => ({
          taskId: t.id,
          userId,
          action: "MOVED",
          field: "columnId",
          newValue: columnId,
        })),
      });

      // Emit socket events per task
      for (const task of tasks) {
        try {
          io?.to(`board:${task.boardId}`).emit("task:updated", { taskId: task.id });
        } catch {
          // ignore
        }
      }

      updated = tasks.length;
      break;
    }

    case "assign": {
      const { assigneeId } = action.payload;

      await prisma.task.updateMany({
        where: { id: { in: taskIds } },
        data: { assigneeId },
      });

      // Create AuditLog + dispatch notification for each task
      await prisma.auditLog.createMany({
        data: tasks.map((t) => ({
          taskId: t.id,
          userId,
          action: "ASSIGNED",
          field: "assigneeId",
          newValue: assigneeId,
        })),
      });

      for (const task of tasks) {
        // Dispatch notification if assignee changed
        if (task.assigneeId !== assigneeId && assigneeId) {
          await dispatch({
            userId: assigneeId,
            type: "TASK_ASSIGNED",
            message: `You have been assigned to: "${task.title}"`,
            link: `/boards/${task.boardId}?task=${task.id}`,
            taskId: task.id,
          });
        }

        try {
          io?.to(`board:${task.boardId}`).emit("task:updated", { taskId: task.id });
        } catch {
          // ignore
        }
      }

      updated = tasks.length;
      break;
    }

    case "label_add": {
      const { labelId } = action.payload;

      // SQLite does not support skipDuplicates — use upsert per task
      for (const taskId of taskIds) {
        await prisma.taskLabel.upsert({
          where: { taskId_labelId: { taskId, labelId } },
          create: { taskId, labelId },
          update: {},
        });
      }

      for (const task of tasks) {
        try {
          io?.to(`board:${task.boardId}`).emit("task:updated", { taskId: task.id });
        } catch {
          // ignore
        }
      }

      updated = tasks.length;
      break;
    }

    case "label_remove": {
      const { labelId } = action.payload;

      await prisma.taskLabel.deleteMany({
        where: {
          taskId: { in: taskIds },
          labelId,
        },
      });

      for (const task of tasks) {
        try {
          io?.to(`board:${task.boardId}`).emit("task:updated", { taskId: task.id });
        } catch {
          // ignore
        }
      }

      updated = tasks.length;
      break;
    }

    case "priority": {
      const { priority } = action.payload;
      const validPriorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
      }

      await prisma.task.updateMany({ where: { id: { in: taskIds } }, data: { priority } });

      await prisma.auditLog.createMany({
        data: tasks.map((t) => ({ taskId: t.id, userId, action: "UPDATED", field: "priority", newValue: priority })),
      });

      for (const task of tasks) {
        try { io?.to(`board:${task.boardId}`).emit("task:updated", { taskId: task.id }); } catch { /* ignore */ }
      }

      updated = tasks.length;
      break;
    }

    case "delete": {
      // Emit deletion events before deleting (so we still have boardId info)
      for (const task of tasks) {
        try {
          io?.to(`board:${task.boardId}`).emit("task:updated", { taskId: task.id });
        } catch {
          // ignore
        }
      }

      await prisma.task.deleteMany({
        where: { id: { in: taskIds } },
      });

      updated = tasks.length;
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown action type" }, { status: 400 });
  }

  return NextResponse.json({ updated });
}
