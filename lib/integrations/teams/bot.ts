/**
 * Teams Bot command handler.
 * Azure Bot Framework sends activity objects to the /api/integrations/teams/bot endpoint.
 * Commands: create task, assign <taskId> <user>, status <taskId>
 */
import { prisma } from "@/lib/db";

interface BotActivity {
  type: string;
  text?: string;
  from?: { id: string; name: string };
  conversation?: { id: string };
  channelId?: string;
  serviceUrl?: string;
}

interface BotResponse {
  type: string;
  text: string;
}

export async function handleBotActivity(
  activity: BotActivity
): Promise<BotResponse | null> {
  if (activity.type !== "message" || !activity.text) return null;

  const text = activity.text.trim().toLowerCase();
  const parts = text.split(/\s+/);
  const command = parts[0];

  switch (command) {
    case "status": {
      const taskId = parts[1];
      if (!taskId) return { type: "message", text: "Usage: status <taskId>" };

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { assignee: true, column: true },
      });

      if (!task) return { type: "message", text: `Task ${taskId} not found.` };

      return {
        type: "message",
        text: `**${task.title}**\nStatus: ${task.column.name}\nAssignee: ${task.assignee?.name ?? "Unassigned"}\nPriority: ${task.priority}\nSLA: ${task.slaStatus}`,
      };
    }

    case "assign": {
      const [, taskId, ...userParts] = parts;
      const userName = userParts.join(" ");

      if (!taskId || !userName)
        return { type: "message", text: "Usage: assign <taskId> <username>" };

      const user = await prisma.user.findFirst({
        where: { name: { contains: userName } },
      });

      if (!user)
        return { type: "message", text: `User "${userName}" not found.` };

      await prisma.task.update({
        where: { id: taskId },
        data: { assigneeId: user.id },
      });

      return {
        type: "message",
        text: `Task ${taskId} assigned to ${user.name}.`,
      };
    }

    case "help":
    default:
      return {
        type: "message",
        text: [
          "**KanBoard Bot Commands:**",
          "• `status <taskId>` — Get task status",
          "• `assign <taskId> <username>` — Assign a task",
          "• `help` — Show this message",
        ].join("\n"),
      };
  }
}
