import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.taskTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, priority, labelIds, subtasks } = body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const template = await prisma.taskTemplate.create({
    data: {
      name,
      description: description || undefined,
      priority: priority || "MEDIUM",
      labelIds: JSON.stringify(labelIds || []),
      subtasks: JSON.stringify(subtasks || []),
      createdById: session.user.id,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
