import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { IntegrationsSettings } from "@/components/settings/integrations-settings";

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const boards = await prisma.board.findMany({
    select: {
      id: true,
      name: true,
      teamsWebhook: true,
      teamsChannelId: true,
      plannerPlanId: true,
      workspace: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground text-sm">
          Configure Microsoft Teams and Planner integration per board
        </p>
      </div>
      <IntegrationsSettings boards={boards} />
    </div>
  );
}
