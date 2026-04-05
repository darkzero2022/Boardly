import cron from "node-cron";
import { prisma } from "@/lib/db";
import type { SLAStatus, Priority } from "@/lib/types";
import { getSLADeadline } from "@/lib/utils";
import { triggerSLAEscalation } from "./escalation";

/**
 * Recalculate slaDeadline for a newly created task.
 */
export async function assignSLADeadline(
  taskId: string,
  priority: Priority,
  boardId: string
): Promise<Date> {
  const policy = await prisma.sLAPolicy.findUnique({ where: { boardId } });
  const deadline = getSLADeadline(priority, policy);

  await prisma.task.update({
    where: { id: taskId },
    data: { slaDeadline: deadline, slaStatus: "OK" },
  });

  return deadline;
}

/**
 * Core SLA evaluation loop — checks all open tasks and updates their status.
 */
export async function runSLACheck() {
  const now = new Date();

  // Tasks that have a deadline and are not yet breached
  const tasks = await prisma.task.findMany({
    where: {
      slaDeadline: { not: null },
      slaStatus: { not: "BREACHED" as SLAStatus },
      // Only tasks not in "Done"-like columns — approximated by checking column name
      column: { name: { not: { in: ["Done", "Closed", "Completed", "Archived"] } } },
    },
    include: {
      board: { include: { slaPolicy: { include: { escalations: true } } } },
      assignee: true,
      column: true,
    },
  });

  const updates: Promise<unknown>[] = [];

  for (const task of tasks) {
    if (!task.slaDeadline) continue;

    const deadline = new Date(task.slaDeadline);
    const totalMs = deadline.getTime() - new Date(task.createdAt).getTime();
    const elapsedMs = now.getTime() - new Date(task.createdAt).getTime();
    const pctElapsed = (elapsedMs / totalMs) * 100;

    let newStatus: SLAStatus = "OK";

    if (now >= deadline) {
      newStatus = "BREACHED";
    } else if (pctElapsed >= 75) {
      newStatus = "AT_RISK";
    }

    if (newStatus !== task.slaStatus) {
      updates.push(
        prisma.task.update({
          where: { id: task.id },
          data: { slaStatus: newStatus },
        })
      );

      // Fire escalation notifications
      updates.push(
        triggerSLAEscalation(task, newStatus, task.board.slaPolicy)
      );
    }

    // Check escalation thresholds even if status hasn't changed
    if (task.board.slaPolicy?.escalations) {
      for (const esc of task.board.slaPolicy.escalations) {
        if (pctElapsed >= esc.triggerPct && pctElapsed < esc.triggerPct + 10) {
          updates.push(triggerSLAEscalation(task, newStatus, task.board.slaPolicy, esc));
        }
      }
    }
  }

  await Promise.allSettled(updates);
  console.log(`[SLA] Checked ${tasks.length} tasks at ${now.toISOString()}`);
}

/**
 * Start the background SLA cron — every 15 minutes.
 */
export function startSLACron() {
  cron.schedule("*/15 * * * *", async () => {
    try {
      await runSLACheck();
    } catch (err) {
      console.error("[SLA] Cron error:", err);
    }
  });
}
