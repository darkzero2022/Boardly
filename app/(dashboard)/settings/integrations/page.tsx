import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { IntegrationsSettings } from "@/components/settings/integrations-settings";
import { WebhookSettings } from "@/components/settings/webhook-settings";

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const [boards, webhooks] = await Promise.all([
    prisma.board.findMany({
      select: {
        id: true,
        name: true,
        teamsWebhook: true,
        teamsChannelId: true,
        plannerPlanId: true,
        workspace: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.webhook.findMany({
      include: { board: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground text-sm">
          Configure Microsoft Teams, Planner, and outbound webhooks
        </p>
      </div>
      <IntegrationsSettings boards={boards} />
      <hr className="border-border" />
      <WebhookSettings initial={webhooks} />
    </div>
  );
}
