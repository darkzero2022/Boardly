import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["TEXT", "NUMBER", "DATE", "SELECT", "CHECKBOX"]).optional(),
  options: z.array(z.string()).optional().nullable(),
  order: z.number().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; fieldId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "MANAGER"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: Record<string, unknown> = { ...parsed.data };
  if ("options" in parsed.data) {
    data.options = parsed.data.options ? JSON.stringify(parsed.data.options) : null;
  }

  const field = await prisma.customFieldDef.update({
    where: { id: params.fieldId, boardId: params.id },
    data,
  });

  return NextResponse.json(field);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; fieldId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "MANAGER"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.customFieldDef.delete({ where: { id: params.fieldId, boardId: params.id } });
  return NextResponse.json({ ok: true });
}
