import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Kanban, Lock, Globe, Users } from "lucide-react";
import { NewWorkspaceDialog } from "@/components/workspaces/new-workspace-dialog";

export default async function WorkspacesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { visibility: "PUBLIC" },
        { team: { users: { some: { id: session.user.id } } } },
        { visibility: "TEAM", team: { users: { some: { id: session.user.id } } } },
      ],
    },
    include: {
      team: true,
      boards: {
        include: {
          _count: { select: { tasks: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground text-sm">
            Manage your workspaces and activity boards
          </p>
        </div>
        <NewWorkspaceDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className="border border-border rounded-xl bg-card p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-base">{ws.name}</h3>
                {ws.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {ws.description}
                  </p>
                )}
              </div>
              <span className="ml-2 shrink-0">
                {ws.visibility === "PRIVATE" ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : ws.visibility === "PUBLIC" ? (
                  <Globe className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Users className="w-4 h-4 text-muted-foreground" />
                )}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
              <Users className="w-3 h-3" />
              <span>{ws.team.name}</span>
              <span className="mx-1">·</span>
              <span>{formatDate(ws.createdAt)}</span>
            </div>

            <div className="space-y-2">
              {ws.boards.slice(0, 3).map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Kanban className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{board.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {board._count.tasks} tasks
                  </span>
                </Link>
              ))}
              {ws.boards.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{ws.boards.length - 3} more boards
                </p>
              )}
            </div>

            <Link href={`/workspaces/${ws.id}`}>
              <Button variant="outline" size="sm" className="w-full mt-3">
                Open Workspace
              </Button>
            </Link>
          </div>
        ))}

        {workspaces.length === 0 && (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <Kanban className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No workspaces yet</p>
            <p className="text-sm">Create your first workspace to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
