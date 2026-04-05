import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
  teamId: z.string(),
  description: z.string().optional(),
  visibility: z.enum(["PRIVATE", "TEAM", "PUBLIC"]).optional().default("TEAM"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      teamId: parsed.data.teamId,
      description: parsed.data.description,
      visibility: parsed.data.visibility,
    },
    include: { team: true },
  });

  return NextResponse.json(workspace, { status: 201 });
}
