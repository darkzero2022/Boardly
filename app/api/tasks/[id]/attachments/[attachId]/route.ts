import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; attachId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: taskId, attachId } = params;

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachId },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  // Verify attachment belongs to the specified task
  if (attachment.taskId !== taskId) {
    return NextResponse.json(
      { error: "Attachment does not belong to this task" },
      { status: 403 }
    );
  }

  // Delete file from disk (ignore error if already missing)
  try {
    const absolutePath = path.join(process.cwd(), "public", attachment.path);
    fs.unlinkSync(absolutePath);
  } catch {
    // File already gone — that's fine
  }

  // Delete DB record
  await prisma.attachment.delete({ where: { id: attachId } });

  return NextResponse.json({ ok: true });
}
