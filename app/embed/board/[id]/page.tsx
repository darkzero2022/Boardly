/**
 * Teams Tab embed — minimal board view without the full sidebar/header.
 * URL configured in the Teams app manifest as the tab URL.
 */
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default async function EmbedBoardPage({
  params,
}: {
  params: { id: string };
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

  if (!board) return <p className="p-4 text-sm text-muted-foreground">Board not found.</p>;

  const users = await prisma.user.findMany({
    select: { id: true, name: true, image: true },
    orderBy: { name: "asc" },
  });
  const labels = await prisma.label.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="px-4 py-2 border-b border-border flex items-center gap-2">
        <span className="font-semibold text-sm">{board.name}</span>
        <span className="text-xs text-muted-foreground">· {board.workspace.name}</span>
      </div>
      <KanbanBoard
        board={board as never}
        users={users}
        labels={labels}
        currentUserId={session.user.id}
      />
    </div>
  );
}
