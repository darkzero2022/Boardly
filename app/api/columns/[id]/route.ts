import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, color, wipLimit } = body;

  const column = await prisma.column.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(wipLimit !== undefined ? { wipLimit: wipLimit === null ? null : parseInt(wipLimit) } : {}),
    },
  });

  return NextResponse.json(column);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const col = await prisma.column.findUnique({
    where: { id: params.id },
    include: { _count: { select: { tasks: true } } },
  });
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (col._count.tasks > 0) return NextResponse.json({ error: "Column has tasks" }, { status: 400 });

  await prisma.column.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
