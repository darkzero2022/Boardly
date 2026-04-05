import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { NotificationSettings } from "@/components/settings/notification-settings";

export default async function NotificationSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [userConfig, globalConfig] = await Promise.all([
    prisma.notifConfig.findUnique({ where: { userId: session.user.id } }),
    session.user.role === "ADMIN"
      ? prisma.globalNotifConfig.findUnique({ where: { id: "global" } })
      : null,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure how and when you receive notifications
        </p>
      </div>
      <NotificationSettings
        userId={session.user.id}
        isAdmin={session.user.role === "ADMIN"}
        userConfig={userConfig}
        globalConfig={globalConfig}
      />
    </div>
  );
}
