import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Papa from "papaparse";

const VALID_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "VIEWER") return NextResponse.json({ error: "Read-only access" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const boardId = formData.get("boardId") as string | null;
  const mapping = formData.get("mapping") as string | null;

  if (!file || !boardId) {
    return NextResponse.json({ error: "file and boardId are required" }, { status: 400 });
  }

  const csvText = await file.text();
  const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (errors.length > 0 && data.length === 0) {
    return NextResponse.json({ error: "Failed to parse CSV" }, { status: 400 });
  }

  // Column map: csv header → task field
  const colMap: Record<string, string> = mapping ? JSON.parse(mapping) : {};

  // Fetch board columns and users for matching
  const [columns, users] = await Promise.all([
    prisma.column.findMany({ where: { boardId }, orderBy: { order: "asc" } }),
    prisma.user.findMany({ select: { id: true, email: true } }),
  ]);

  if (columns.length === 0) {
    return NextResponse.json({ error: "Board has no columns" }, { status: 400 });
  }

  const colByName = Object.fromEntries(columns.map((c) => [c.name.toLowerCase(), c.id]));
  const userByEmail = Object.fromEntries(users.map((u) => [u.email?.toLowerCase() ?? "", u.id]));

  const maxOrder = await prisma.task.aggregate({
    where: { columnId: columns[0].id },
    _max: { order: true },
  });
  let orderCounter = (maxOrder._max.order ?? 0) + 1;

  const imported: string[] = [];
  const skipped: string[] = [];

  function field(row: Record<string, string>, csvKey: string): string {
    const mapped = colMap[csvKey];
    return (mapped ? row[mapped] : row[csvKey] ?? "")?.trim() ?? "";
  }

  const tasksToCreate = data
    .map((row, i) => {
      const title = field(row, "title");
      if (!title) { skipped.push(`Row ${i + 2}: missing title`); return null; }

      const columnName = field(row, "columnName").toLowerCase();
      const columnId = colByName[columnName] ?? columns[0].id;

      const rawPriority = field(row, "priority").toUpperCase();
      const priority = VALID_PRIORITIES.includes(rawPriority) ? rawPriority : "MEDIUM";

      const assigneeEmail = field(row, "assigneeEmail").toLowerCase();
      const assigneeId = userByEmail[assigneeEmail] ?? null;

      const dueDateRaw = field(row, "dueDate");
      const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
      if (dueDate && isNaN(dueDate.getTime())) {
        skipped.push(`Row ${i + 2}: invalid dueDate "${dueDateRaw}"`);
        return null;
      }

      imported.push(title);
      return {
        title,
        description: field(row, "description") || null,
        boardId,
        columnId,
        priority: priority as never,
        assigneeId,
        dueDate,
        order: orderCounter++,
        reporterId: session.user!.id,
      };
    })
    .filter(Boolean);

  if (tasksToCreate.length > 0) {
    await prisma.task.createMany({ data: tasksToCreate as never[] });
  }

  // Emit socket event so the board reloads
  const io = (globalThis as Record<string, unknown>).__socketio as import("socket.io").Server | undefined;
  if (io) io.to(`board:${boardId}`).emit("board:refresh");

  return NextResponse.json({
    imported: imported.length,
    skipped: skipped.length,
    errors: skipped,
  });
}
