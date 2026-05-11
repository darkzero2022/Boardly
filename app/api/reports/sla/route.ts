import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Daily breakdown for chart
  const tasks = await prisma.task.findMany({
    where: { createdAt: { gte: since }, slaDeadline: { not: null } },
    select: { createdAt: true, slaStatus: true },
  });

  // Group by day
  const byDay: Record<string, { ok: number; atRisk: number; breached: number }> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = { ok: 0, atRisk: 0, breached: 0 };
  }

  for (const task of tasks) {
    const key = new Date(task.createdAt).toISOString().slice(0, 10);
    if (!byDay[key]) continue;
    if (task.slaStatus === "BREACHED") byDay[key].breached++;
    else if (task.slaStatus === "AT_RISK") byDay[key].atRisk++;
    else byDay[key].ok++;
  }

  const chart = Object.entries(byDay).map(([date, counts]) => ({
    date,
    ...counts,
    total: counts.ok + counts.atRisk + counts.breached,
    compliancePct:
      counts.ok + counts.atRisk + counts.breached === 0
        ? 100
        : Math.round(
            (counts.ok / (counts.ok + counts.atRisk + counts.breached)) * 100
          ),
  }));

  // Summary
  const total = tasks.length;
  const breached = tasks.filter((t) => t.slaStatus === "BREACHED").length;
  const atRisk = tasks.filter((t) => t.slaStatus === "AT_RISK").length;

  return NextResponse.json(
    {
      chart,
      summary: {
        total,
        ok: total - breached - atRisk,
        atRisk,
        breached,
        compliancePct: total === 0 ? 100 : Math.round(((total - breached) / total) * 100),
      },
    },
    { headers: { "Cache-Control": "private, max-age=60" } }
  );
}
