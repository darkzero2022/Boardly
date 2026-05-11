"use client";

import { useMemo, useRef } from "react";
import { addDays, differenceInDays, format, startOfDay } from "date-fns";

interface Task {
  id: string;
  title: string;
  priority: string;
  dueDate?: string | null;
  createdAt: string;
  assignee?: { name: string | null } | null;
  columnId: string;
}

interface TimelineViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  groupBy?: "column" | "assignee";
  columns?: { id: string; name: string }[];
}

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#3b82f6",
  LOW: "#9ca3af",
};

const DAY_WIDTH = 36; // px per day
const ROW_HEIGHT = 36; // px per row
const LABEL_WIDTH = 200; // px for task name column

export function TimelineView({ tasks, onTaskClick, columns = [] }: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = startOfDay(new Date());

  // Compute timeline bounds
  const { startDate, totalDays } = useMemo(() => {
    const dates = tasks.flatMap(t => {
      const created = new Date(t.createdAt);
      const due = t.dueDate ? new Date(t.dueDate) : null;
      return due ? [created, due] : [created];
    });
    if (dates.length === 0) {
      return { startDate: addDays(today, -7), totalDays: 60 };
    }
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    const s = addDays(min, -3);
    const e = addDays(max, 7);
    return { startDate: s, totalDays: Math.max(differenceInDays(e, s), 30) };
  }, [tasks, today]);

  const todayOffset = differenceInDays(today, startDate);

  // Build week headers
  const weeks = useMemo(() => {
    const result: { label: string; startDay: number; days: number }[] = [];
    let d = startDate;
    let idx = 0;
    while (idx < totalDays) {
      const weekEnd = Math.min(idx + 7, totalDays);
      result.push({ label: format(d, "MMM d"), startDay: idx, days: weekEnd - idx });
      d = addDays(d, 7);
      idx += 7;
    }
    return result;
  }, [startDate, totalDays]);

  // Build day headers (just day numbers)
  const days = useMemo(() => Array.from({ length: totalDays }, (_, i) => {
    const d = addDays(startDate, i);
    return { label: format(d, "d"), isToday: differenceInDays(d, today) === 0, isWeekend: [0, 6].includes(d.getDay()) };
  }), [startDate, totalDays, today]);

  // Group tasks by column name
  const grouped = useMemo(() => {
    if (columns.length === 0) return [{ label: "Tasks", tasks }];
    const colMap = Object.fromEntries(columns.map(c => [c.id, c.name]));
    const groups: Record<string, Task[]> = {};
    for (const t of tasks) {
      const colName = colMap[t.columnId] ?? "Other";
      if (!groups[colName]) groups[colName] = [];
      groups[colName].push(t);
    }
    return Object.entries(groups).map(([label, tasks]) => ({ label, tasks }));
  }, [tasks, columns]);

  const totalWidth = totalDays * DAY_WIDTH + LABEL_WIDTH;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <div style={{ width: totalWidth, minHeight: "100%" }}>
          {/* Week header */}
          <div className="flex sticky top-0 z-20 bg-background border-b border-border">
            <div style={{ width: LABEL_WIDTH }} className="flex-shrink-0 border-r border-border" />
            <div className="flex">
              {weeks.map((w, i) => (
                <div
                  key={i}
                  style={{ width: w.days * DAY_WIDTH }}
                  className="text-xs font-semibold text-muted-foreground px-2 py-1.5 border-r border-border bg-muted/30"
                >
                  {w.label}
                </div>
              ))}
            </div>
          </div>

          {/* Day header */}
          <div className="flex sticky top-[30px] z-20 bg-background border-b border-border">
            <div style={{ width: LABEL_WIDTH }} className="flex-shrink-0 border-r border-border px-3 py-1 text-xs text-muted-foreground">Task</div>
            <div className="flex">
              {days.map((d, i) => (
                <div
                  key={i}
                  style={{ width: DAY_WIDTH }}
                  className={`text-[10px] text-center py-1 border-r border-border flex-shrink-0 ${d.isToday ? "bg-primary/10 text-primary font-bold" : d.isWeekend ? "bg-muted/40 text-muted-foreground" : "text-muted-foreground"}`}
                >
                  {d.label}
                </div>
              ))}
            </div>
          </div>

          {/* Task rows by group */}
          {grouped.map(group => (
            <div key={group.label}>
              <div className="flex items-center bg-muted/50 border-b border-border px-3 py-1.5" style={{ minWidth: totalWidth }}>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</span>
              </div>
              {group.tasks.map(task => {
                const created = startOfDay(new Date(task.createdAt));
                const due = task.dueDate ? startOfDay(new Date(task.dueDate)) : null;

                const barStart = Math.max(0, differenceInDays(created, startDate));
                const barEnd = due ? Math.min(totalDays, differenceInDays(due, startDate) + 1) : barStart + 1;
                const barWidth = Math.max(barEnd - barStart, 1) * DAY_WIDTH;
                const barLeft = barStart * DAY_WIDTH;
                const color = PRIORITY_COLOR[task.priority] ?? "#9ca3af";

                return (
                  <div
                    key={task.id}
                    className="flex items-center border-b border-border hover:bg-accent/30 cursor-pointer transition-colors"
                    style={{ height: ROW_HEIGHT, minWidth: totalWidth }}
                    onClick={() => onTaskClick(task.id)}
                  >
                    {/* Label */}
                    <div
                      style={{ width: LABEL_WIDTH }}
                      className="flex-shrink-0 px-3 border-r border-border flex items-center gap-1.5 min-w-0"
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs truncate">{task.title}</span>
                    </div>

                    {/* Timeline area */}
                    <div className="flex-1 relative" style={{ width: totalDays * DAY_WIDTH, height: ROW_HEIGHT }}>
                      {/* Today line */}
                      {todayOffset >= 0 && todayOffset < totalDays && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-primary/40 z-10"
                          style={{ left: todayOffset * DAY_WIDTH }}
                        />
                      )}

                      {/* Task bar */}
                      <div
                        className="absolute top-2 rounded-full"
                        style={{
                          left: barLeft,
                          width: barWidth - 2,
                          height: ROW_HEIGHT - 16,
                          backgroundColor: color,
                          opacity: 0.85,
                        }}
                        title={`${task.title}${due ? ` — due ${format(due, "MMM d")}` : " (no due date)"}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
