"use client";

import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  priority: string;
  slaStatus: string;
  slaDeadline: Date | null;
  dueDate: Date | null;
  order: number;
  columnId: string;
  assignee: { id: string; name: string | null; image: string | null } | null;
  labels: { labelId: string; label: { id: string; name: string; color: string } }[];
  _count: { subtasks: number; comments: number; attachments: number };
}

interface Column {
  id: string;
  name: string;
  color: string;
  wipLimit?: number | null;
  tasks: Task[];
}

interface SwimlaneViewProps {
  columns: Column[];
  boardId: string;
  users: { id: string; name: string | null; image: string | null }[];
  labels: { id: string; name: string; color: string }[];
  groupBy: "assignee" | "priority" | "label";
  onTaskClick: (taskId: string) => void;
}

const PRIORITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-300",
  HIGH: "bg-orange-100 text-orange-700 border-orange-300",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-300",
  LOW: "bg-green-100 text-green-700 border-green-300",
};

function getPriorityDotClass(priority: string): string {
  switch (priority) {
    case "CRITICAL": return "bg-red-500";
    case "HIGH": return "bg-orange-500";
    case "MEDIUM": return "bg-yellow-500";
    case "LOW": return "bg-green-500";
    default: return "bg-gray-400";
  }
}

function buildSwimlanes(
  columns: Column[],
  groupBy: "assignee" | "priority" | "label"
): { key: string; label: string; color?: string }[] {
  const allTasks = columns.flatMap((c) => c.tasks);

  if (groupBy === "priority") {
    return PRIORITY_ORDER.map((p) => ({ key: p, label: p }));
  }

  if (groupBy === "assignee") {
    const seen = new Map<string, string>();
    allTasks.forEach((t) => {
      const key = t.assignee?.id ?? "__unassigned__";
      const label = t.assignee?.name ?? "Unassigned";
      if (!seen.has(key)) seen.set(key, label);
    });
    if (!seen.has("__unassigned__")) seen.set("__unassigned__", "Unassigned");
    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
  }

  // label grouping
  const seen = new Map<string, string>();
  allTasks.forEach((t) => {
    if (t.labels.length === 0) {
      if (!seen.has("__unlabeled__")) seen.set("__unlabeled__", "Unlabeled");
    } else {
      t.labels.forEach((tl) => {
        if (!seen.has(tl.label.id)) seen.set(tl.label.id, tl.label.name);
      });
    }
  });
  if (!seen.has("__unlabeled__")) seen.set("__unlabeled__", "Unlabeled");
  return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
}

function taskMatchesSwimlane(task: Task, key: string, groupBy: "assignee" | "priority" | "label"): boolean {
  if (groupBy === "priority") {
    return task.priority === key;
  }
  if (groupBy === "assignee") {
    if (key === "__unassigned__") return task.assignee === null;
    return task.assignee?.id === key;
  }
  // label
  if (key === "__unlabeled__") return task.labels.length === 0;
  return task.labels.some((tl) => tl.label.id === key);
}

export function SwimlaneView({ columns, groupBy, onTaskClick }: SwimlaneViewProps) {
  const swimlanes = buildSwimlanes(columns, groupBy);

  return (
    <div className="overflow-auto w-full">
      {/* Column header row */}
      <div className="flex sticky top-0 z-20 bg-background border-b border-border">
        <div className="w-40 shrink-0 border-r border-border" />
        {columns.map((col) => (
          <div
            key={col.id}
            className="w-64 shrink-0 px-3 py-2 border-r border-border last:border-r-0"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: col.color }}
              />
              <span className="text-sm font-semibold truncate">{col.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Swimlane rows */}
      {swimlanes.map((lane) => {
        const totalCount = columns.reduce(
          (sum, col) =>
            sum + col.tasks.filter((t) => taskMatchesSwimlane(t, lane.key, groupBy)).length,
          0
        );

        return (
          <div key={lane.key} className="flex border-b border-border last:border-b-0">
            {/* Swimlane label */}
            <div className="w-40 shrink-0 sticky left-0 z-10 bg-muted border-r border-border px-3 py-3 flex flex-col justify-start gap-1">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground truncate">
                {lane.label}
              </span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-background border border-border text-[10px] font-semibold text-muted-foreground">
                {totalCount}
              </span>
            </div>

            {/* Column cells */}
            {columns.map((col) => {
              const tasks = col.tasks.filter((t) =>
                taskMatchesSwimlane(t, lane.key, groupBy)
              );

              return (
                <div
                  key={col.id}
                  className="w-64 shrink-0 border-r border-border last:border-r-0 p-2 flex flex-col gap-1.5 min-h-[80px] bg-muted/30"
                >
                  {tasks.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground/50">—</span>
                    </div>
                  )}
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick(task.id)}
                      className="w-full text-left bg-background border border-border rounded-md px-2.5 py-2 hover:border-primary/40 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={cn(
                            "mt-1 w-2 h-2 rounded-full shrink-0",
                            getPriorityDotClass(task.priority)
                          )}
                          title={task.priority}
                        />
                        <span className="text-xs leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {task.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
