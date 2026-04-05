"use client";

import { cn } from "@/lib/utils";

interface TaskLabel {
  label: {
    name: string;
    color: string;
  };
}

interface Task {
  id: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  slaStatus: "OK" | "AT_RISK" | "BREACHED" | null;
  dueDate: string | Date | null;
  board: {
    id: string;
    name: string;
  };
  column: {
    name: string;
  };
  labels: TaskLabel[];
}

interface MyTasksCardProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

const PRIORITY_ORDER: Task["priority"][] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const PRIORITY_CONFIG: Record<
  Task["priority"],
  { label: string; dotClass: string; headerClass: string }
> = {
  CRITICAL: {
    label: "Critical",
    dotClass: "bg-red-500",
    headerClass: "text-red-600",
  },
  HIGH: {
    label: "High",
    dotClass: "bg-orange-500",
    headerClass: "text-orange-600",
  },
  MEDIUM: {
    label: "Medium",
    dotClass: "bg-yellow-500",
    headerClass: "text-yellow-600",
  },
  LOW: {
    label: "Low",
    dotClass: "bg-gray-400",
    headerClass: "text-muted-foreground",
  },
};

function SlaBadge({ status }: { status: Task["slaStatus"] }) {
  if (!status || status === "OK") return null;
  if (status === "AT_RISK") {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
        At Risk
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 border border-red-200">
      Breached
    </span>
  );
}

export function MyTasksCard({ tasks, onTaskClick }: MyTasksCardProps) {
  const grouped = PRIORITY_ORDER.reduce<Record<Task["priority"], Task[]>>(
    (acc, priority) => {
      acc[priority] = tasks.filter((t) => t.priority === priority);
      return acc;
    },
    { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] }
  );

  return (
    <div className="rounded-lg border border-border bg-card flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">My Tasks</h2>
        <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold w-5 h-5">
          {tasks.length}
        </span>
      </div>

      {/* Body */}
      <div className="max-h-[480px] overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
            No tasks assigned to you
          </div>
        ) : (
          <div className="divide-y divide-border">
            {PRIORITY_ORDER.map((priority) => {
              const group = grouped[priority];
              if (group.length === 0) return null;
              const config = PRIORITY_CONFIG[priority];
              return (
                <div key={priority}>
                  {/* Priority group header */}
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-accent/40">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", config.dotClass)} />
                    <span className={cn("text-xs font-semibold uppercase tracking-wide", config.headerClass)}>
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {group.length}
                    </span>
                  </div>

                  {/* Task rows */}
                  {group.map((task) => (
                    <button
                      key={task.id}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-left transition-colors"
                      onClick={() => onTaskClick(task.id)}
                    >
                      <span className={cn("w-2 h-2 rounded-full shrink-0", config.dotClass)} />

                      {/* Title */}
                      <span className="flex-1 text-sm text-foreground truncate">
                        {task.title}
                      </span>

                      {/* Board chip */}
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-accent text-muted-foreground border border-border shrink-0 max-w-[100px] truncate">
                        {task.board.name}
                      </span>

                      {/* SLA badge */}
                      <SlaBadge status={task.slaStatus} />

                      {/* Column name */}
                      <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                        {task.column.name}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
