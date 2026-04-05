import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  if (q.length < 2) {
    return NextResponse.json({ tasks: [], comments: [], boards: [] });
  }

  const term = `%${q}%`;

  const [tasks, comments, boards] = await Promise.all([
    prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        boardId: true,
        columnId: true,
        priority: true,
        slaStatus: true,
      },
      take: 8,
    }),

    prisma.comment.findMany({
      where: {
        body: { contains: q },
      },
      select: {
        id: true,
        body: true,
        taskId: true,
        task: {
          select: {
            title: true,
            boardId: true,
          },
        },
      },
      take: 8,
    }),

    prisma.board.findMany({
      where: {
        name: { contains: q },
      },
      select: {
        id: true,
        name: true,
        workspaceId: true,
      },
      take: 8,
    }),
  ]);

  // Suppress unused variable warning from term (SQLite uses contains not raw)
  void term;

  return NextResponse.json({ tasks, comments, boards });
}
