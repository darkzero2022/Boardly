import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  secret: z.string().optional().nullable(),
  events: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  boardId: z.string().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const webhook = await prisma.webhook.findUnique({
    where: { id: params.id },
    include: { board: { select: { id: true, name: true } } },
  });
  if (!webhook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(webhook);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.events) data.events = JSON.stringify(parsed.data.events);

  const webhook = await prisma.webhook.update({
    where: { id: params.id },
    data,
    include: { board: { select: { id: true, name: true } } },
  });

  return NextResponse.json(webhook);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.webhook.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
