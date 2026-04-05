import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Global notification config
  await prisma.globalNotifConfig.upsert({
    where: { id: "global" },
    create: {
      id: "global",
      allowInApp: true,
      allowEmail: false,
      allowTeams: false,
      allowBrowser: false,
      allowMicrosoftSSO: true,
      allowCredentials: true,
    },
    update: {},
  });

  // Default labels
  const defaultLabels = [
    { name: "Bug", color: "#ef4444" },
    { name: "Feature", color: "#3b82f6" },
    { name: "Urgent", color: "#f97316" },
    { name: "Documentation", color: "#6b7280" },
    { name: "Enhancement", color: "#8b5cf6" },
    { name: "In Review", color: "#f59e0b" },
    { name: "Blocked", color: "#dc2626" },
    { name: "Good First Task", color: "#22c55e" },
  ];

  for (const label of defaultLabels) {
    await prisma.label.upsert({
      where: { name: label.name },
      create: label,
      update: {},
    });
  }

  // Admin team
  const team = await prisma.team.upsert({
    where: { id: "team-default" },
    create: {
      id: "team-default",
      name: "Operations",
      description: "Default team",
    },
    update: {},
  });

  // Admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@boardly.local" },
    create: {
      name: "Admin",
      email: "admin@boardly.local",
      passwordHash: adminPassword,
      role: "ADMIN",
      teamId: team.id,
    },
    update: {},
  });

  // Demo manager
  const managerPassword = await bcrypt.hash("manager123", 12);
  const manager = await prisma.user.upsert({
    where: { email: "manager@boardly.local" },
    create: {
      name: "Alice Manager",
      email: "manager@boardly.local",
      passwordHash: managerPassword,
      role: "MANAGER",
      teamId: team.id,
    },
    update: {},
  });

  // Demo member
  const memberPassword = await bcrypt.hash("member123", 12);
  const member = await prisma.user.upsert({
    where: { email: "member@boardly.local" },
    create: {
      name: "Bob Member",
      email: "member@boardly.local",
      passwordHash: memberPassword,
      role: "MEMBER",
      teamId: team.id,
    },
    update: {},
  });

  // Default workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: "ws-default" },
    create: {
      id: "ws-default",
      name: "Operations",
      description: "Main operations workspace",
      teamId: team.id,
      visibility: "TEAM",
    },
    update: {},
  });

  // Sample board
  const board = await prisma.board.upsert({
    where: { id: "board-default" },
    create: {
      id: "board-default",
      name: "Team Activities",
      description: "Track ongoing team activities",
      workspaceId: workspace.id,
    },
    update: {},
  });

  // Columns
  const colData = [
    { id: "col-todo", name: "To Do", color: "#94a3b8", order: 0 },
    { id: "col-inprogress", name: "In Progress", color: "#3b82f6", order: 1 },
    { id: "col-review", name: "Review", color: "#f59e0b", order: 2 },
    { id: "col-done", name: "Done", color: "#22c55e", order: 3 },
  ];

  for (const col of colData) {
    await prisma.column.upsert({
      where: { id: col.id },
      create: { ...col, boardId: board.id },
      update: {},
    });
  }

  // SLA Policy
  await prisma.sLAPolicy.upsert({
    where: { boardId: board.id },
    create: {
      boardId: board.id,
      criticalHours: 4,
      highHours: 24,
      mediumHours: 72,
      lowHours: 168,
      escalations: {
        create: [
          { triggerPct: 75, notifyRoles: JSON.stringify(["MEMBER"]) },
          { triggerPct: 90, notifyRoles: JSON.stringify(["MEMBER", "MANAGER"]) },
          { triggerPct: 100, notifyRoles: JSON.stringify(["MEMBER", "MANAGER", "ADMIN"]) },
        ],
      },
    },
    update: {},
  });

  // Sample tasks
  const bugLabel = await prisma.label.findUnique({ where: { name: "Bug" } });
  const featureLabel = await prisma.label.findUnique({ where: { name: "Feature" } });
  const urgentLabel = await prisma.label.findUnique({ where: { name: "Urgent" } });

  const sampleTasks = [
    {
      id: "task-1",
      title: "Set up monitoring dashboard",
      description: "Configure Grafana for real-time system monitoring @Alice Manager",
      priority: "HIGH" as const,
      columnId: "col-inprogress",
      assigneeId: manager.id,
      labelIds: [featureLabel!.id],
    },
    {
      id: "task-2",
      title: "Fix login redirect bug",
      description: "Users are not redirected correctly after SSO login",
      priority: "CRITICAL" as const,
      columnId: "col-todo",
      assigneeId: member.id,
      labelIds: [bugLabel!.id, urgentLabel!.id],
    },
    {
      id: "task-3",
      title: "Update team onboarding docs",
      description: "Add new hire checklist and tool access guide",
      priority: "MEDIUM" as const,
      columnId: "col-todo",
      assigneeId: admin.id,
      labelIds: [],
    },
    {
      id: "task-4",
      title: "Weekly security scan",
      description: "Run automated vulnerability scan on all services",
      priority: "HIGH" as const,
      columnId: "col-review",
      assigneeId: manager.id,
      isRecurring: true,
      recurrenceRule: "0 9 * * 1",
      labelIds: [],
    },
  ];

  for (const task of sampleTasks) {
    const slaHours = { CRITICAL: 4, HIGH: 24, MEDIUM: 72, LOW: 168 }[task.priority];
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    await prisma.task.upsert({
      where: { id: task.id },
      create: {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        boardId: board.id,
        columnId: task.columnId,
        assigneeId: task.assigneeId,
        reporterId: admin.id,
        slaDeadline,
        slaStatus: "OK",
        isRecurring: task.isRecurring ?? false,
        recurrenceRule: task.recurrenceRule ?? null,
        labels: task.labelIds.length
          ? { create: task.labelIds.map((id) => ({ labelId: id })) }
          : undefined,
      },
      update: {},
    });
  }

  console.log("\n✅ Database seeded successfully!");
  console.log("\nDefault accounts:");
  console.log("  Admin:   admin@boardly.local   / admin123");
  console.log("  Manager: manager@boardly.local / manager123");
  console.log("  Member:  member@boardly.local  / member123");
  console.log("\nAccess at: http://localhost:3000\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
