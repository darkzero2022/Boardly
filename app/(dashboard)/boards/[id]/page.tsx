import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { BoardHeader } from "@/components/kanban/board-header";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { task?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const board = await prisma.board.findUnique({
    where: { id: params.id },
    include: {
      workspace: { include: { team: true } },
      columns: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
            include: {
              assignee: { select: { id: true, name: true, image: true } },
              labels: { include: { label: true } },
              _count: { select: { subtasks: true, comments: true, attachments: true } },
            },
          },
        },
      },
      slaPolicy: true,
    },
  });

  if (!board) notFound();

  // All users for assignee picker
  const users = await prisma.user.findMany({
    select: { id: true, name: true, image: true },
    orderBy: { name: "asc" },
  });

  const labels = await prisma.label.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col h-full -m-6">
      <BoardHeader board={board} session={session} />
      <KanbanBoard
        board={board}
        users={users}
        labels={labels}
        openTaskId={searchParams.task}
        currentUserId={session.user.id!}
      />
    </div>
  );
}
