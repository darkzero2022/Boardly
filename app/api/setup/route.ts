import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET() {
  const [userCount, config] = await Promise.all([
    prisma.user.count(),
    prisma.globalNotifConfig.findUnique({ where: { id: "global" } }),
  ]);

  const needed = userCount === 0 && !config?.setupComplete;

  if (!needed) {
    return NextResponse.json(
      { needed: false, appMode: config?.appMode ?? "team" },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  }

  return NextResponse.json({ needed: true, appMode: "team" });
}

const setupSchema = z.object({
  workspaceName: z.string().min(1).max(100),
  mode: z.enum(["solo", "team"]),
  adminName: z.string().min(1).max(100),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { workspaceName, mode, adminName, adminEmail, adminPassword } = parsed.data;

  // Hash password before opening the transaction — bcrypt is CPU-bound and
  // holding a write transaction open while it runs blocks other writers
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  try {
    await prisma.$transaction(async (tx) => {
      const count = await tx.user.count();
      if (count > 0) throw Object.assign(new Error("already_done"), { code: "ALREADY_DONE" });

      const team = await tx.team.create({
        data: { name: workspaceName },
      });

      await tx.workspace.create({
        data: { name: workspaceName, teamId: team.id, visibility: "TEAM" },
      });

      await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          role: "ADMIN",
          teamId: team.id,
        },
      });

      await tx.globalNotifConfig.upsert({
        where: { id: "global" },
        create: { id: "global", setupComplete: true, appMode: mode },
        update: { setupComplete: true, appMode: mode },
      });
    });
  } catch (err: unknown) {
    if (err instanceof Error && (err as NodeJS.ErrnoException & { code?: string }).code === "ALREADY_DONE") {
      return NextResponse.json({ error: "Setup already completed." }, { status: 409 });
    }
    console.error("Setup error:", err);
    return NextResponse.json({ error: "Setup failed. Please try again." }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true }, { status: 201 });
  response.cookies.set("setup_complete", "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
