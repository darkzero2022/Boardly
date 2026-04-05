import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate, slaStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Priority } from "@/lib/types";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [myTasks, recentActivity, slaStats] = await Promise.all([
    // Tasks assigned to me
    prisma.task.findMany({
      where: { assigneeId: session.user.id, column: { name: { notIn: ["Done", "Closed", "Completed"] } } },
      include: { board: true, column: true, labels: { include: { label: true } } },
      orderBy: { slaDeadline: "asc" },
      take: 10,
    }),
    // Recent audit logs
    prisma.auditLog.findMany({
      where: { userId: session.user.id },
      include: { task: { select: { id: true, title: true, boardId: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    // SLA overview counts
    prisma.task.groupBy({
      by: ["slaStatus"],
      _count: true,
    }),
  ]);

  const slaMap = Object.fromEntries(
    slaStats.map((s) => [s.slaStatus, s._count])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {session.user.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here&apos;s what&apos;s on your plate today.
        </p>
      </div>

      {/* SLA Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "On Track", status: "OK", color: "bg-green-50 border-green-200", text: "text-green-700" },
          { label: "At Risk", status: "AT_RISK", color: "bg-yellow-50 border-yellow-200", text: "text-yellow-700" },
          { label: "SLA Breached", status: "BREACHED", color: "bg-red-50 border-red-200", text: "text-red-700" },
        ].map((card) => (
          <div key={card.status} className={`rounded-xl border p-4 ${card.color}`}>
            <p className={`text-sm font-medium ${card.text}`}>{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.text}`}>
              {slaMap[card.status] ?? 0}
            </p>
            <p className={`text-xs mt-1 ${card.text} opacity-70`}>tasks</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* My Tasks */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">My Open Tasks</h2>
          {myTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No open tasks assigned to you.
            </p>
          ) : (
            <div className="space-y-2">
              {myTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/boards/${task.boardId}?task=${task.id}`}
                  className="flex items-start justify-between p-3 rounded-lg hover:bg-accent transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.board.name} · {task.column.name}
                    </p>
                    {task.labels.slice(0, 2).map((tl) => (
                      <span
                        key={tl.labelId}
                        className="inline-block text-[10px] px-1.5 py-0.5 rounded-full mr-1 mt-1 text-white"
                        style={{ backgroundColor: tl.label.color }}
                      >
                        {tl.label.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                    <Badge
                      variant={
                        task.priority === "CRITICAL"
                          ? "danger"
                          : task.priority === "HIGH"
                          ? "warning"
                          : "outline"
                      }
                      className="text-[10px]"
                    >
                      {task.priority}
                    </Badge>
                    <span
                      className={`text-[10px] font-semibold ${slaStatusColor(task.slaStatus)}`}
                    >
                      {task.slaStatus}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No recent activity.
            </p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{log.action}</span>{" "}
                      {log.field && <span className="text-muted-foreground">({log.field})</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {log.task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
