import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taskId = params.id;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // blocks: dependencies where THIS task is the blocker (taskId = this task)
  // blockedBy: dependencies where THIS task is blocked (dependsOnId = this task)
  const [blocks, blockedBy] = await Promise.all([
    prisma.taskDependency.findMany({
      where: { taskId },
      include: {
        dependsOn: { select: { id: true, title: true } },
      },
    }),
    prisma.taskDependency.findMany({
      where: { dependsOnId: taskId },
      include: {
        task: { select: { id: true, title: true } },
      },
    }),
  ]);

  return NextResponse.json({ blocks, blockedBy });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taskId = params.id;
  const body = await req.json();
  const { dependsOnId } = body as { dependsOnId: string };

  if (!dependsOnId) {
    return NextResponse.json({ error: "dependsOnId is required" }, { status: 400 });
  }

  // Prevent self-dependency
  if (taskId === dependsOnId) {
    return NextResponse.json(
      { error: "A task cannot depend on itself" },
      { status: 400 }
    );
  }

  // Prevent circular dependency: check if dependsOnId already depends on taskId
  const circular = await prisma.taskDependency.findFirst({
    where: { taskId: dependsOnId, dependsOnId: taskId },
  });

  if (circular) {
    return NextResponse.json(
      { error: "Circular dependency detected" },
      { status: 409 }
    );
  }

  // Create the dependency
  const dependency = await prisma.taskDependency.create({
    data: { taskId, dependsOnId },
    include: {
      task: { select: { id: true, title: true } },
      dependsOn: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(dependency, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taskId = params.id;
  const body = await req.json();
  const { dependsOnId } = body as { dependsOnId: string };

  if (!dependsOnId) {
    return NextResponse.json({ error: "dependsOnId is required" }, { status: 400 });
  }

  const existing = await prisma.taskDependency.findUnique({
    where: { taskId_dependsOnId: { taskId, dependsOnId } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Dependency not found" }, { status: 404 });
  }

  await prisma.taskDependency.delete({
    where: { taskId_dependsOnId: { taskId, dependsOnId } },
  });

  return NextResponse.json({ ok: true });
}
