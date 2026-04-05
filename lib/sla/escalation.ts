import { prisma } from "@/lib/db";
import type { SLAStatus } from "@/lib/types";
import { dispatch } from "@/lib/notifications/dispatcher";

export async function triggerSLAEscalation(
  task: {
    id: string;
    title: string;
    boardId: string;
    assigneeId: string | null;
    board: { id: string; name: string };
  },
  status: SLAStatus,
  policy: {
    boardId: string;
    escalations: { triggerPct: number; notifyRoles: string }[];
  } | null,
  escalation?: { triggerPct: number; notifyRoles: string }
) {
  const type =
    status === "BREACHED" ? "SLA_BREACH" : "SLA_WARNING";
  const message =
    status === "BREACHED"
      ? `SLA breached: "${task.title}" is overdue`
      : `SLA at risk: "${task.title}" is approaching its deadline`;

  const link = `/boards/${task.boardId}?task=${task.id}`;

  // Determine who to notify
  const rolesToNotify: string[] = escalation
    ? JSON.parse(escalation.notifyRoles)
    : status === "BREACHED"
    ? ["ADMIN", "MANAGER", "MEMBER"]
    : ["MEMBER"];

  // Get users with those roles who are board members
  const users = await prisma.user.findMany({
    where: {
      role: { in: rolesToNotify },
      OR: [
        { id: task.assigneeId ?? undefined },
        {
          boardMembers: {
            some: { boardId: task.boardId },
          },
        },
      ],
    },
    select: { id: true },
  });

  await Promise.allSettled(
    users.map((u) =>
      dispatch({
        userId: u.id,
        type,
        message,
        link,
      })
    )
  );
}
