import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Fetch user details for mention search
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [myTasks, dueToday, overdue, slaBreached, mentions, recentActivity] =
    await Promise.all([
      // My open tasks
      prisma.task.findMany({
        where: { assigneeId: userId },
        include: {
          column: true,
          board: true,
          labels: { include: { label: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),

      // Due today
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          dueDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        include: {
          column: true,
          board: true,
          labels: { include: { label: true } },
        },
        orderBy: { dueDate: "asc" },
      }),

      // Overdue
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          dueDate: { lt: startOfToday },
        },
        include: {
          column: true,
          board: true,
          labels: { include: { label: true } },
        },
        orderBy: { dueDate: "asc" },
      }),

      // SLA breached
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          slaStatus: "BREACHED",
        },
        include: {
          column: true,
          board: true,
          labels: { include: { label: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),

      // Mentions in comments
      prisma.comment.findMany({
        where: {
          OR: [
            user?.name ? { body: { contains: `@${user.name}` } } : {},
            user?.email
              ? { body: { contains: `@${user.email.split("@")[0]}` } }
              : {},
          ].filter((o) => Object.keys(o).length > 0),
        },
        include: {
          task: {
            select: { id: true, title: true, boardId: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Recent audit activity
      prisma.auditLog.findMany({
        where: { userId },
        include: {
          task: {
            select: { id: true, title: true, boardId: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  return NextResponse.json({
    myTasks,
    dueToday,
    overdue,
    slaBreached,
    mentions,
    recentActivity,
  });
}
