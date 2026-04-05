import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { StatsRow } from "@/components/dashboard/stats-row";
import { MyTasksCard } from "@/components/dashboard/my-tasks-card";
import { MentionsFeed } from "@/components/dashboard/mentions-feed";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardTaskNav } from "@/components/dashboard/dashboard-task-nav";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const [myTasks, dueTodayCount, overdueCount, breachedCount, mentions, activities] =
    await Promise.all([
      // All open tasks assigned to me
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          column: { name: { notIn: ["Done", "Closed", "Completed"] } },
        },
        include: {
          board: { select: { id: true, name: true } },
          column: { select: { name: true } },
          labels: { include: { label: true } },
        },
        orderBy: { slaDeadline: "asc" },
        take: 30,
      }),
      // Due today count
      prisma.task.count({
        where: {
          assigneeId: userId,
          dueDate: { gte: todayStart, lt: todayEnd },
        },
      }),
      // Overdue count
      prisma.task.count({
        where: {
          assigneeId: userId,
          dueDate: { lt: todayStart },
          column: { name: { notIn: ["Done", "Closed", "Completed"] } },
        },
      }),
      // SLA breached count (all tasks)
      prisma.task.count({ where: { slaStatus: "BREACHED" } }),
      // Mentions (comments containing @userId or @name)
      prisma.comment.findMany({
        where: { body: { contains: `@${session.user.name ?? ""}` } },
        include: {
          author: { select: { name: true } },
          task: { select: { id: true, title: true, boardId: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // Recent activity (team-wide audit logs)
      prisma.auditLog.findMany({
        include: {
          user: { select: { name: true } },
          task: { select: { id: true, title: true, boardId: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {session.user.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here&apos;s what&apos;s on your plate today.
        </p>
      </div>

      <StatsRow
        myTasksCount={myTasks.length}
        dueTodayCount={dueTodayCount}
        overdueCount={overdueCount}
        breachedCount={breachedCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: My Tasks */}
        <DashboardTaskNav tasks={myTasks as any} />

        {/* Right: Mentions + Activity */}
        <div className="space-y-6">
          <MentionsFeed
            mentions={mentions as any}
            onTaskClick={() => {}}
          />
          <ActivityFeed activities={activities as any} />
        </div>
      </div>
    </div>
  );
}
