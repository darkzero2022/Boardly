import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { teamsWebhook, teamsChannelId, plannerPlanId } = await req.json();

  const board = await prisma.board.update({
    where: { id: params.id },
    data: {
      teamsWebhook: teamsWebhook || null,
      teamsChannelId: teamsChannelId || null,
      plannerPlanId: plannerPlanId || null,
    },
  });

  return NextResponse.json(board);
}
