import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { labelId } = await req.json();

  await prisma.taskLabel.upsert({
    where: { taskId_labelId: { taskId: params.id, labelId } },
    create: { taskId: params.id, labelId },
    update: {},
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { labelId } = await req.json();

  await prisma.taskLabel.delete({
    where: { taskId_labelId: { taskId: params.id, labelId } },
  });

  return NextResponse.json({ success: true });
}
