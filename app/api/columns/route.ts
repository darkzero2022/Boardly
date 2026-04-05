import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
  boardId: z.string(),
  color: z.string().optional().default("#6366f1"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const maxOrder = await prisma.column.aggregate({
    where: { boardId: parsed.data.boardId },
    _max: { order: true },
  });

  const column = await prisma.column.create({
    data: {
      name: parsed.data.name,
      boardId: parsed.data.boardId,
      color: parsed.data.color,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  return NextResponse.json(column, { status: 201 });
}
