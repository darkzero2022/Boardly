import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { SLASettings } from "@/components/settings/sla-settings";

export default async function SLASettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "MEMBER") redirect("/");

  const boards = await prisma.board.findMany({
    include: {
      workspace: { select: { name: true } },
      slaPolicy: { include: { escalations: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SLA Policies</h1>
        <p className="text-muted-foreground text-sm">
          Configure response/resolution times and escalation rules per board
        </p>
      </div>
      <SLASettings boards={boards as never} />
    </div>
  );
}
