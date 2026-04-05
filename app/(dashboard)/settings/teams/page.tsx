import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { TeamManagement } from "@/components/settings/team-management";

export default async function TeamsSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const teams = await prisma.team.findMany({
    include: {
      _count: { select: { users: true, workspaces: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Teams</h1>
        <p className="text-muted-foreground text-sm">Manage teams and their members</p>
      </div>
      <TeamManagement initialTeams={teams as never} />
    </div>
  );
}
