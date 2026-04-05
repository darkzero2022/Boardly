import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
  workspaceId: z.string(),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const board = await prisma.board.create({
    data: {
      name: parsed.data.name,
      workspaceId: parsed.data.workspaceId,
      description: parsed.data.description,
      // Create default columns
      columns: {
        create: [
          { name: "To Do", color: "#94a3b8", order: 0 },
          { name: "In Progress", color: "#3b82f6", order: 1 },
          { name: "Review", color: "#f59e0b", order: 2 },
          { name: "Done", color: "#22c55e", order: 3 },
        ],
      },
      // Create default SLA policy
      slaPolicy: {
        create: {
          criticalHours: 4,
          highHours: 24,
          mediumHours: 72,
          lowHours: 168,
          escalations: {
            create: [
              { triggerPct: 75, notifyRoles: JSON.stringify(["MEMBER"]) },
              { triggerPct: 90, notifyRoles: JSON.stringify(["MEMBER", "MANAGER"]) },
              { triggerPct: 100, notifyRoles: JSON.stringify(["MEMBER", "MANAGER", "ADMIN"]) },
            ],
          },
        },
      },
    },
  });

  return NextResponse.json(board, { status: 201 });
}
