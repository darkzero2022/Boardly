import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dispatch } from "@/lib/notifications/dispatcher";
import { parseMentions } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const comments = await prisma.comment.findMany({
    where: { taskId: params.id },
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Body required" }, { status: 400 });

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      taskId: params.id,
      authorId: session.user.id,
      body: body.trim(),
    },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  // Process @mentions
  const mentions = parseMentions(body);
  if (mentions.length > 0) {
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
            message: `${session.user!.name} mentioned you in a comment on "${task.title}"`,
            link: `/boards/${task.boardId}?task=${task.id}`,
            taskId: task.id,
          })
        )
    );
  }

  // Emit to board socket room
  const io = (globalThis as Record<string, unknown>).__socketio as import("socket.io").Server | undefined;
  if (io) {
    io.to(`board:${task.boardId}`).emit("comment:added", { taskId: params.id, comment });
  }

  return NextResponse.json(comment, { status: 201 });
}
