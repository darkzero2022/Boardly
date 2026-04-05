import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { v4 as uuid } from "uuid";
import fs from "fs";
import path from "path";

function getIO() {
  try {
    return (
      ((globalThis as Record<string, unknown>).__socketio as import("socket.io").Server) ?? null
    );
  } catch {
    return null;
  }
}

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

  const attachments = await prisma.attachment.findMany({
    where: { taskId },
    include: {
      uploadedBy: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(attachments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const taskId = params.id;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Build upload directory path
  const uploadDir = path.join(process.cwd(), "public", "uploads", taskId);
  fs.mkdirSync(uploadDir, { recursive: true });

  const uniqueFilename = `${uuid()}-${file.name}`;
  const filePath = path.join(uploadDir, uniqueFilename);

  // Read file bytes and write to disk
  const arrayBuffer = await file.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

  // Public-facing path (relative to /public)
  const publicPath = `/uploads/${taskId}/${uniqueFilename}`;

  const attachment = await prisma.attachment.create({
    data: {
      taskId,
      uploadedById: userId,
      filename: uniqueFilename,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      path: publicPath,
    },
    include: {
      uploadedBy: { select: { id: true, name: true, image: true } },
    },
  });

  // Emit socket event
  try {
    const io = getIO();
    io?.to(`board:${task.boardId}`).emit("task:updated", { taskId });
  } catch {
    // socket may not be available during testing
  }

  return NextResponse.json(attachment, { status: 201 });
}
