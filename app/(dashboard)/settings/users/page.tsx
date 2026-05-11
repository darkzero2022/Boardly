import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { UserManagement } from "@/components/settings/user-management";

export default async function UsersSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const [users, teams] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        teamId: true,
        team: { select: { id: true, name: true } },
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  const usersWithLastLogin = users.map((u) => ({ ...u }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground text-sm">
          Add, edit, and manage user accounts and roles
        </p>
      </div>
      <UserManagement
        initialUsers={usersWithLastLogin as never}
        teams={teams}
        currentUserId={session.user.id}
      />
    </div>
  );
}
