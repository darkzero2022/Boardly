import { prisma } from "@/lib/db";

interface AuditEntry {
  taskId: string;
  userId: string;
  action: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
}

export async function logAudit(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        taskId: entry.taskId,
        userId: entry.userId,
        action: entry.action,
        field: entry.field,
        oldValue: entry.oldValue ? String(entry.oldValue) : null,
        newValue: entry.newValue ? String(entry.newValue) : null,
      },
    });
  } catch (err) {
    console.error("[Audit] Failed to log:", err);
  }
}

/**
 * Compare two task snapshots and log all changed fields.
 */
export async function logTaskDiff(
  taskId: string,
  userId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>
) {
  const fields = [
    "title",
    "description",
    "columnId",
    "assigneeId",
    "priority",
    "dueDate",
    "slaStatus",
    "slaDeadline",
  ];

  const promises = fields
    .filter((f) => before[f] !== after[f])
    .map((field) =>
      logAudit({
        taskId,
        userId,
        action: "UPDATED",
        field,
        oldValue: before[field] as string | null,
        newValue: after[field] as string | null,
      })
    );

  await Promise.allSettled(promises);
}
