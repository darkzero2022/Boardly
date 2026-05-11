import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const values = await prisma.customFieldValue.findMany({
    where: { taskId: params.id },
    include: { field: true },
  });

  return NextResponse.json(values);
}

const upsertSchema = z.object({
  values: z.array(z.object({ fieldId: z.string(), value: z.string().nullable() })),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return NextResponse.json({ error: "Read-only" }, { status: 403 });

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await Promise.all(
    parsed.data.values.map(({ fieldId, value }) =>
      prisma.customFieldValue.upsert({
        where: { taskId_fieldId: { taskId: params.id, fieldId } },
        create: { taskId: params.id, fieldId, value },
        update: { value },
      })
    )
  );

  const values = await prisma.customFieldValue.findMany({
    where: { taskId: params.id },
    include: { field: true },
  });

  return NextResponse.json(values);
}
