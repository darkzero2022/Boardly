import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId") ?? undefined;

  const tasks = await prisma.task.findMany({
    where: { boardId },
    include: {
      board: { select: { name: true } },
      column: { select: { name: true } },
      assignee: { select: { name: true } },
      reporter: { select: { name: true } },
      labels: { include: { label: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Tasks");

  sheet.columns = [
    { header: "ID", key: "id", width: 14 },
    { header: "Title", key: "title", width: 40 },
    { header: "Board", key: "board", width: 20 },
    { header: "Column", key: "column", width: 16 },
    { header: "Priority", key: "priority", width: 12 },
    { header: "SLA Status", key: "slaStatus", width: 12 },
    { header: "Assignee", key: "assignee", width: 20 },
    { header: "Reporter", key: "reporter", width: 20 },
    { header: "Labels", key: "labels", width: 24 },
    { header: "Due Date", key: "dueDate", width: 18 },
    { header: "SLA Deadline", key: "slaDeadline", width: 18 },
    { header: "Created", key: "createdAt", width: 18 },
  ];

  // Header styling
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3B82F6" },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  for (const task of tasks) {
    sheet.addRow({
      id: task.id.slice(-8),
      title: task.title,
      board: task.board.name,
      column: task.column.name,
      priority: task.priority,
      slaStatus: task.slaStatus,
      assignee: task.assignee?.name ?? "Unassigned",
      reporter: task.reporter?.name ?? "",
      labels: task.labels.map((l) => l.label.name).join(", "),
      dueDate: task.dueDate?.toISOString().slice(0, 16) ?? "",
      slaDeadline: task.slaDeadline?.toISOString().slice(0, 16) ?? "",
      createdAt: task.createdAt.toISOString().slice(0, 16),
    });
  }

  // Color SLA status cells
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const cell = row.getCell("slaStatus");
    if (cell.value === "BREACHED") cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFECACA" } };
    else if (cell.value === "AT_RISK") cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
    else cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="kanboard-export-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
