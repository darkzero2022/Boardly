import { prisma } from "@/lib/db";
import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

function getGraphClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * Get a Graph API access token using client credentials flow.
 */
async function getAppAccessToken(): Promise<string> {
  const tenantId = process.env.GRAPH_TENANT_ID!;
  const clientId = process.env.GRAPH_CLIENT_ID!;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET!;

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );

  const data = await res.json();
  return data.access_token;
}

/**
 * Push a KanBoard task to Microsoft Planner.
 */
export async function pushTaskToPlanner(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      board: true,
      assignee: true,
      plannerSync: true,
    },
  });

  if (!task || !task.board.plannerPlanId) return;

  const token = await getAppAccessToken();
  const client = getGraphClient(token);

  const plannerTaskBody = {
    planId: task.board.plannerPlanId,
    title: task.title,
    dueDateTime: task.dueDate ?? task.slaDeadline,
    priority: mapPriorityToPlanner(task.priority),
  };

  if (task.plannerSync) {
    // Update existing Planner task
    await client
      .api(`/planner/tasks/${task.plannerSync.plannerId}`)
      .patch(plannerTaskBody);

    await prisma.plannerSync.update({
      where: { taskId },
      data: { lastSyncAt: new Date() },
    });
  } else {
    // Create new Planner task
    const created = await client.api("/planner/tasks").post(plannerTaskBody);

    await prisma.plannerSync.create({
      data: {
        taskId,
        plannerId: created.id,
        syncDirection: "BOTH",
      },
    });
  }
}

/**
 * Pull an update from a Planner task into KanBoard.
 */
export async function pullTaskFromPlanner(plannerId: string) {
  const sync = await prisma.plannerSync.findFirst({
    where: { plannerId },
    include: { task: true },
  });

  if (!sync) return;

  const token = await getAppAccessToken();
  const client = getGraphClient(token);

  const plannerTask = await client.api(`/planner/tasks/${plannerId}`).get();

  await prisma.task.update({
    where: { id: sync.taskId },
    data: {
      title: plannerTask.title ?? sync.task.title,
      dueDate: plannerTask.dueDateTime
        ? new Date(plannerTask.dueDateTime)
        : sync.task.dueDate,
    },
  });

  await prisma.plannerSync.update({
    where: { id: sync.id },
    data: { lastSyncAt: new Date() },
  });
}

function mapPriorityToPlanner(priority: string): number {
  return { CRITICAL: 1, HIGH: 3, MEDIUM: 5, LOW: 9 }[priority] ?? 5;
}
