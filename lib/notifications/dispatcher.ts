import { prisma } from "@/lib/db";
import { sendEmail } from "./email";
import { sendTeamsNotification } from "@/lib/integrations/teams/webhook";
import { sendBrowserPush } from "./push";
import { createHmac } from "crypto";

interface DispatchPayload {
  userId: string;
  type: string;
  message: string;
  link?: string;
  taskId?: string;
}

/** Dispatch to all watchers of a task (except the actor who triggered the event). */
export async function dispatchToWatchers(
  taskId: string,
  actorId: string,
  payload: Omit<DispatchPayload, "userId">
) {
  const watchers = await prisma.taskWatcher.findMany({
    where: { taskId, userId: { not: actorId } },
    select: { userId: true },
  });
  await Promise.allSettled(
    watchers.map((w) => dispatch({ ...payload, userId: w.userId, taskId }))
  );
}

export async function dispatch(payload: DispatchPayload) {
  const [userConfig, globalConfig] = await Promise.all([
    prisma.notifConfig.findUnique({ where: { userId: payload.userId } }),
    prisma.globalNotifConfig.findUnique({ where: { id: "global" } }),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { email: true, name: true },
  });

  if (!user) return;

  const promises: Promise<unknown>[] = [];

  // In-app notification (always store in DB if inApp allowed)
  const inAppAllowed = globalConfig?.allowInApp ?? true;
  const inAppWanted = userConfig?.inApp ?? true;

  if (inAppAllowed && inAppWanted) {
    promises.push(
      prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          message: payload.message,
          link: payload.link,
        },
      })
    );

    // Emit socket event if available
    const io = getIO();
    if (io) {
      io.to(`user:${payload.userId}`).emit("notification", {
        type: payload.type,
        message: payload.message,
        link: payload.link,
      });
    }
  }

  // Email
  if (
    globalConfig?.allowEmail &&
    (userConfig?.email ?? false) &&
    user.email
  ) {
    promises.push(
      sendEmail({
        to: user.email,
        subject: `Boardly: ${payload.type.replace(/_/g, " ")}`,
        text: payload.message,
        html: `<p>${payload.message}</p>${
          payload.link
            ? `<p><a href="${process.env.NEXTAUTH_URL}${payload.link}">View task</a></p>`
            : ""
        }`,
      })
    );
  }

  // Teams
  if (globalConfig?.allowTeams && (userConfig?.teams ?? false)) {
    // Send to board channel webhook if taskId provided
    if (payload.taskId) {
      const task = await prisma.task.findUnique({
        where: { id: payload.taskId },
        include: { board: true },
      });
      if (task?.board.teamsWebhook) {
        promises.push(
          sendTeamsNotification(task.board.teamsWebhook, {
            title: payload.type.replace(/_/g, " "),
            text: payload.message,
            link: `${process.env.NEXTAUTH_URL}${payload.link}`,
          })
        );
      }
    }
  }

  // Browser push
  if (globalConfig?.allowBrowser && (userConfig?.browser ?? false)) {
    promises.push(sendBrowserPush(payload.userId, payload.message));
  }

  await Promise.allSettled(promises);
}

/** Block private / loopback / link-local IPs to prevent SSRF from stored webhook URLs. */
function isSafeWebhookUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return false;
    if (/^169\.254\./.test(host)) return false;
    if (/^10\./.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    if (/^192\.168\./.test(host)) return false;
    return true;
  } catch { return false; }
}

/** Fire outbound webhooks for a given event. Fire-and-forget — never throws. */
export async function dispatchWebhooks(event: string, payload: object, boardId?: string) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        active: true,
        // boardId undefined → only global (boardId: null) webhooks fire
        OR: boardId
          ? [{ boardId: null }, { boardId }]
          : [{ boardId: null }],
      },
    });
    for (const wh of webhooks) {
      try {
        if (!isSafeWebhookUrl(wh.url)) continue; // SSRF guard
        const events: string[] = JSON.parse(wh.events);
        if (!events.includes(event)) continue;
        const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (wh.secret) {
          headers["X-Boardly-Signature"] = createHmac("sha256", wh.secret).update(body).digest("hex");
        }
        // Fire-and-forget with a 10-second timeout so hanging endpoints
        // don't keep the Node.js event loop alive indefinitely
        fetch(wh.url, {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(10_000),
        }).catch(() => {});
      } catch {
        // skip individual failures
      }
    }
  } catch {
    // never block the caller
  }
}

// Lazy import to avoid circular dependency
function getIO() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return ((globalThis as Record<string, unknown>).__socketio as import("socket.io").Server) ?? null;
  } catch {
    return null;
  }
}
