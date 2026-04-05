interface TeamsCard {
  title: string;
  text: string;
  link?: string;
  facts?: { name: string; value: string }[];
}

export async function sendTeamsNotification(
  webhookUrl: string,
  card: TeamsCard
) {
  const body = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: "0076D7",
    summary: card.title,
    sections: [
      {
        activityTitle: card.title,
        activityText: card.text,
        facts: card.facts ?? [],
        markdown: true,
      },
    ],
    ...(card.link
      ? {
          potentialAction: [
            {
              "@type": "OpenUri",
              name: "View in Boardly",
              targets: [{ os: "default", uri: card.link }],
            },
          ],
        }
      : {}),
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`[Teams Webhook] Failed: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error("[Teams Webhook] Error:", err);
  }
}

/**
 * Send an Adaptive Card with task details to a Teams channel.
 */
export async function sendTaskCard(
  webhookUrl: string,
  task: {
    id: string;
    title: string;
    priority: string;
    assignee?: { name: string } | null;
    slaStatus: string;
    board: { id: string; name: string };
  },
  action: "CREATED" | "UPDATED" | "SLA_BREACHED" | "COMPLETED"
) {
  const actionLabel = {
    CREATED: "New task created",
    UPDATED: "Task updated",
    SLA_BREACHED: "⚠️ SLA Breached",
    COMPLETED: "✅ Task completed",
  }[action];

  const themeColor = {
    CREATED: "0076D7",
    UPDATED: "F8A100",
    SLA_BREACHED: "D13438",
    COMPLETED: "107C10",
  }[action];

  await sendTeamsNotification(webhookUrl, {
    title: `${actionLabel}: ${task.title}`,
    text: `Board: **${task.board.name}** | Priority: **${task.priority}** | SLA: **${task.slaStatus}**`,
    link: `${process.env.NEXTAUTH_URL}/boards/${task.board.id}?task=${task.id}`,
    facts: [
      { name: "Assignee", value: task.assignee?.name ?? "Unassigned" },
      { name: "Priority", value: task.priority },
      { name: "SLA Status", value: task.slaStatus },
    ],
  });
}
