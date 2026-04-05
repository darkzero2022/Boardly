import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.boardTemplate.findMany({
    include: {
      columns: { orderBy: { order: "asc" } },
      slaPolicy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, boardId } = body;
  if (!name || !boardId) return NextResponse.json({ error: "name and boardId required" }, { status: 400 });

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      columns: { orderBy: { order: "asc" } },
      slaPolicy: true,
    },
  });
  if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

  const template = await prisma.boardTemplate.create({
    data: {
      name,
      description: description || undefined,
      createdById: session.user.id,
      columns: {
        create: board.columns.map((col) => ({
          name: col.name,
          color: col.color,
          order: col.order,
          wipLimit: col.wipLimit ?? undefined,
        })),
      },
      ...(board.slaPolicy
        ? {
            slaPolicy: {
              create: {
                criticalHours: board.slaPolicy.criticalHours,
                highHours: board.slaPolicy.highHours,
                mediumHours: board.slaPolicy.mediumHours,
                lowHours: board.slaPolicy.lowHours,
              },
            },
          }
        : {}),
    },
    include: {
      columns: { orderBy: { order: "asc" } },
      slaPolicy: true,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
