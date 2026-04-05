import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { criticalHours, highHours, mediumHours, lowHours } = await req.json();

  const policy = await prisma.sLAPolicy.upsert({
    where: { boardId: params.id },
    create: {
      boardId: params.id,
      criticalHours: criticalHours ?? 4,
      highHours: highHours ?? 24,
      mediumHours: mediumHours ?? 72,
      lowHours: lowHours ?? 168,
    },
    update: { criticalHours, highHours, mediumHours, lowHours },
  });

  return NextResponse.json(policy);
}
