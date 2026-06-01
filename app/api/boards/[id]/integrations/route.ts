import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSafeWebhookUrl } from "@/lib/notifications/dispatcher";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { teamsWebhook, teamsChannelId, plannerPlanId } = await req.json();

  if (teamsWebhook && !isSafeWebhookUrl(teamsWebhook)) {
    return NextResponse.json({ error: "Teams webhook URL is not allowed (private/internal addresses are blocked)" }, { status: 400 });
  }

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
