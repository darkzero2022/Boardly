import cron from "node-cron";
import { prisma } from "@/lib/db";

export function startRecurringCron() {
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    console.log("[Recurring] Checking recurring tasks...");
    // fetch all recurring tasks
    const tasks = await prisma.task.findMany({
      where: { isRecurring: true, recurrenceRule: { not: null } },
      include: { labels: true },
    });

    const now = new Date();

    for (const task of tasks) {
      // Parse recurrenceRule: "daily" | "weekly" | "monthly" | cron-like string
      // lastRecurredAt defaults to createdAt if null
      const lastRun = task.lastRecurredAt ?? task.createdAt;
      let nextRun: Date | null = null;

      if (task.recurrenceRule === "daily") {
        nextRun = new Date(lastRun.getTime() + 24 * 60 * 60 * 1000);
      } else if (task.recurrenceRule === "weekly") {
        nextRun = new Date(lastRun.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (task.recurrenceRule === "monthly") {
        const d = new Date(lastRun);
        d.setMonth(d.getMonth() + 1);
        nextRun = d;
      }

      if (!nextRun || now < nextRun) continue;

      // Clone the task
      const newTask = await prisma.task.create({
        data: {
          title: task.title,
          description: task.description,
          boardId: task.boardId,
          columnId: task.columnId,
          assigneeId: task.assigneeId,
          reporterId: task.reporterId,
          priority: task.priority,
          order: task.order,
        },
      });

      // Copy labels (SQLite does not support skipDuplicates — use upsert per label)
      for (const l of task.labels) {
        await prisma.taskLabel.upsert({
          where: { taskId_labelId: { taskId: newTask.id, labelId: l.labelId } },
          create: { taskId: newTask.id, labelId: l.labelId },
          update: {},
        });
      }

      // Update lastRecurredAt
      await prisma.task.update({
        where: { id: task.id },
        data: { lastRecurredAt: now },
      });

      console.log(`[Recurring] Created task copy for "${task.title}" -> ${newTask.id}`);
    }
  });

  console.log("> Recurring task scheduler started (runs every hour)");
}
