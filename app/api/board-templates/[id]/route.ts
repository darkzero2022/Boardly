import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const template = await prisma.boardTemplate.findUnique({
    where: { id: params.id },
    include: {
      columns: { orderBy: { order: "asc" } },
      slaPolicy: true,
    },
  });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(template);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.boardTemplate.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
