import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

/** Verify the task exists and the session user has access to its board. */
async function getTaskWithAccess(taskId: string, userId: string, role: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      boardId: true,
      board: {
        select: {
          workspace: {
            select: { members: { select: { userId: true } } },
          },
        },
      },
    },
  });
  if (!task) return null;

  // ADMIN can access any task; other roles must be workspace members
  if (role === "ADMIN") return task;
  const isMember = task.board.workspace.members.some((m) => m.userId === userId);
  return isMember ? task : null;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await getTaskWithAccess(params.id, session.user.id, session.user.role ?? "");
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const values = await prisma.customFieldValue.findMany({
    where: { taskId: params.id },
    include: { field: true },
  });

  return NextResponse.json(values);
}

const upsertSchema = z.object({
  values: z.array(z.object({ fieldId: z.string(), value: z.string().nullable() })),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return NextResponse.json({ error: "Read-only" }, { status: 403 });

  const task = await getTaskWithAccess(params.id, session.user.id, session.user.role ?? "");
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Verify every fieldId belongs to this task's board (prevents cross-board pollution)
  const fieldIds = parsed.data.values.map((v) => v.fieldId);
  if (fieldIds.length > 0) {
    const fields = await prisma.customFieldDef.findMany({
      where: { id: { in: fieldIds }, boardId: task.boardId },
      select: { id: true },
    });
    const validFieldIds = new Set(fields.map((f) => f.id));
    const invalidFields = fieldIds.filter((id) => !validFieldIds.has(id));
    if (invalidFields.length > 0) {
      return NextResponse.json({ error: "One or more field IDs do not belong to this board" }, { status: 400 });
    }
  }

  await Promise.all(
    parsed.data.values.map(({ fieldId, value }) =>
      prisma.customFieldValue.upsert({
        where: { taskId_fieldId: { taskId: params.id, fieldId } },
        create: { taskId: params.id, fieldId, value },
        update: { value },
      })
    )
  );

  const values = await prisma.customFieldValue.findMany({
    where: { taskId: params.id },
    include: { field: true },
  });

  return NextResponse.json(values);
}
