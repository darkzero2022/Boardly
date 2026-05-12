import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");
  const days = parseInt(searchParams.get("days") ?? "14");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const [created, completed] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        action: "CREATED",
        createdAt: { gte: since },
        task: boardId ? { boardId } : undefined,
      },
      select: { createdAt: true },
    }),
    prisma.auditLog.findMany({
      where: {
        action: "UPDATED",
        field: "columnId",
        newValue: { in: ["Done", "Completed", "Closed"] },
        createdAt: { gte: since },
        task: boardId ? { boardId } : undefined,
      },
      select: { createdAt: true },
    }),
  ]);

  const byDay: Record<string, { created: number; completed: number }> = {};
  for (let i = 0; i <= days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    byDay[d.toISOString().slice(0, 10)] = { created: 0, completed: 0 };
  }

  for (const log of created) {
    const key = new Date(log.createdAt).toISOString().slice(0, 10);
    if (byDay[key]) byDay[key].created++;
  }
  for (const log of completed) {
    const key = new Date(log.createdAt).toISOString().slice(0, 10);
    if (byDay[key]) byDay[key].completed++;
  }

  const chart = Object.entries(byDay).map(([date, counts]) => ({ date, ...counts }));

  return NextResponse.json(chart, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
