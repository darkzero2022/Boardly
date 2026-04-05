import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Kanban, Plus, ArrowLeft } from "lucide-react";
import { NewBoardDialog } from "@/components/workspaces/new-board-dialog";

export default async function WorkspacePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.id },
    include: {
      team: true,
      boards: {
        include: {
          _count: { select: { tasks: true } },
          slaPolicy: true,
          columns: { orderBy: { order: "asc" }, take: 1 },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!workspace) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/workspaces">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-muted-foreground text-sm">{workspace.description}</p>
          )}
        </div>
        <NewBoardDialog workspaceId={workspace.id} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspace.boards.map((board) => (
          <Link
            key={board.id}
            href={`/boards/${board.id}`}
            className="border border-border rounded-xl bg-card p-5 hover:shadow-md hover:border-primary/50 transition-all group"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Kanban className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {board.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {board._count.tasks} tasks
                  {board.slaPolicy ? " · SLA enabled" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{board.columns.length > 0 ? "Active board" : "No columns yet"}</span>
              <span className="text-primary font-medium group-hover:underline">
                Open board →
              </span>
            </div>
          </Link>
        ))}

        {workspace.boards.length === 0 && (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <Kanban className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No boards yet</p>
            <p className="text-sm">Add your first board to start tracking activities.</p>
          </div>
        )}
      </div>
    </div>
  );
}
