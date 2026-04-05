import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, workspaceId } = body;
  if (!name || !workspaceId) return NextResponse.json({ error: "name and workspaceId required" }, { status: 400 });

  const template = await prisma.boardTemplate.findUnique({
    where: { id: params.id },
    include: {
      columns: { orderBy: { order: "asc" } },
      slaPolicy: true,
    },
  });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const board = await prisma.board.create({
    data: {
      name,
      workspaceId,
      columns: {
        create: template.columns.map((col) => ({
          name: col.name,
          color: col.color,
          order: col.order,
          wipLimit: col.wipLimit ?? undefined,
        })),
      },
      ...(template.slaPolicy
        ? {
            slaPolicy: {
              create: {
                criticalHours: template.slaPolicy.criticalHours,
                highHours: template.slaPolicy.highHours,
                mediumHours: template.slaPolicy.mediumHours,
                lowHours: template.slaPolicy.lowHours,
              },
            },
          }
        : {}),
    },
    include: { columns: true },
  });

  return NextResponse.json(board, { status: 201 });
}
