import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit/middleware";
import { dispatchWebhooks } from "@/lib/notifications/dispatcher";
import { z } from "zod";

const schema = z.object({
  columnId: z.string(),
  order: z.number(),
  boardId: z.string(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const before = await prisma.task.findUnique({ where: { id: params.id } });

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: { columnId: parsed.data.columnId, order: parsed.data.order },
  });

  if (before && before.columnId !== parsed.data.columnId) {
    const [oldCol, newCol] = await Promise.all([
      prisma.column.findUnique({ where: { id: before.columnId } }),
      prisma.column.findUnique({ where: { id: parsed.data.columnId } }),
    ]);
    await logAudit({
      taskId: params.id,
      userId: session.user.id,
      action: "UPDATED",
      field: "columnId",
      oldValue: oldCol?.name,
      newValue: newCol?.name,
    });
  }

  // Emit socket
  const io = (globalThis as Record<string, unknown>).__socketio as import("socket.io").Server | undefined;
  if (io) {
    io.to(`board:${parsed.data.boardId}`).emit("task:moved", {
      taskId: params.id,
      columnId: parsed.data.columnId,
      order: parsed.data.order,
    });
  }

  // Outbound webhooks
  dispatchWebhooks("task.moved", { taskId: params.id, columnId: parsed.data.columnId }, parsed.data.boardId);

  return NextResponse.json(updated);
}
