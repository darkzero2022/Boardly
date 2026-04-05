import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const template = await prisma.taskTemplate.findUnique({ where: { id: params.id } });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(template);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, priority, labelIds, subtasks } = body;

  const template = await prisma.taskTemplate.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(labelIds !== undefined ? { labelIds: JSON.stringify(labelIds) } : {}),
      ...(subtasks !== undefined ? { subtasks: JSON.stringify(subtasks) } : {}),
    },
  });

  return NextResponse.json(template);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const template = await prisma.taskTemplate.findUnique({ where: { id: params.id } });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = template.createdById === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.taskTemplate.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
