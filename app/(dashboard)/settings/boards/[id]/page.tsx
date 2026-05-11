import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { CustomFieldManager } from "@/components/settings/custom-field-manager";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function BoardSettingsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!["ADMIN", "MANAGER"].includes(session.user.role ?? "")) redirect("/");

  const board = await prisma.board.findUnique({
    where: { id: params.id },
    include: {
      workspace: { select: { name: true } },
      customFields: { orderBy: { order: "asc" } },
    },
  });
  if (!board) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/boards/${board.id}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{board.name} — Settings</h1>
          <p className="text-muted-foreground text-sm">{board.workspace.name}</p>
        </div>
      </div>

      <CustomFieldManager boardId={board.id} initial={board.customFields} />
    </div>
  );
}
