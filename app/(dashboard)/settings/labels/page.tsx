import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { LabelsManager } from "@/components/settings/labels-manager";

export default async function LabelsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const labels = await prisma.label.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { tasks: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Labels</h1>
        <p className="text-muted-foreground text-sm">
          Manage global labels used across all boards
        </p>
      </div>
      <LabelsManager initialLabels={labels as never} isAdmin={session.user.role === "ADMIN"} />
    </div>
  );
}
