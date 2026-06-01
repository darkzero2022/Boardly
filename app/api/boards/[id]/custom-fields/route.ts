import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const VALID_TYPES = ["TEXT", "NUMBER", "DATE", "SELECT", "CHECKBOX"];

const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["TEXT", "NUMBER", "DATE", "SELECT", "CHECKBOX"]),
  options: z.array(z.string()).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "ADMIN") {
    const membership = await prisma.boardMember.findFirst({
      where: { boardId: params.id, userId: session.user.id },
    });
    if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fields = await prisma.customFieldDef.findMany({
    where: { boardId: params.id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(fields);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "MANAGER"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const maxOrder = await prisma.customFieldDef.aggregate({
    where: { boardId: params.id },
    _max: { order: true },
  });

  const field = await prisma.customFieldDef.create({
    data: {
      boardId: params.id,
      name: parsed.data.name,
      type: parsed.data.type,
      options: parsed.data.options ? JSON.stringify(parsed.data.options) : null,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  return NextResponse.json(field, { status: 201 });
}

// Suppress unused warning
void VALID_TYPES;
