import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      _count: false,
      assignedTasks: {
        where: {
          column: { name: { notIn: ["Done", "Closed", "Completed"] } },
        },
        select: { id: true, slaStatus: true, priority: true },
      },
    },
  });

  const workload = users.map((u) => ({
    id: u.id,
    name: u.name,
    image: u.image,
    total: u.assignedTasks.length,
    ok: u.assignedTasks.filter((t) => t.slaStatus === "OK").length,
    atRisk: u.assignedTasks.filter((t) => t.slaStatus === "AT_RISK").length,
    breached: u.assignedTasks.filter((t) => t.slaStatus === "BREACHED").length,
    critical: u.assignedTasks.filter((t) => t.priority === "CRITICAL").length,
  }));

  return NextResponse.json(workload);
}
