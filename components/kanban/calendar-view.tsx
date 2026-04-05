"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  slaStatus: "OK" | "AT_RISK" | "BREACHED" | null;
  dueDate: string | Date | null;
  columnId: string;
}

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getTaskChipColor(task: Task): string {
  if (task.slaStatus === "BREACHED") return "bg-red-500 text-white";
  switch (task.priority) {
    case "CRITICAL":
      return "bg-red-500 text-white";
    case "HIGH":
      return "bg-orange-500 text-white";
    case "MEDIUM":
      return "bg-blue-500 text-white";
    case "LOW":
      return "bg-gray-400 text-white";
    default:
      return "bg-gray-400 text-white";
  }
}

const MAX_VISIBLE_TASKS = 3;

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group tasks by ISO date string (YYYY-MM-DD)
  const tasksByDay = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (!task.dueDate) return acc;
    const key = format(new Date(task.dueDate), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  return (
    <div className="rounded-lg border border-border bg-card flex flex-col">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <h2 className="text-sm font-semibold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </h2>

        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_HEADERS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1">
        {calendarDays.map((day, idx) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay[key] ?? [];
          const visibleTasks = dayTasks.slice(0, MAX_VISIBLE_TASKS);
          const overflowCount = dayTasks.length - MAX_VISIBLE_TASKS;
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const todayHighlight = isToday(day);

          return (
            <div
              key={idx}
              className={cn(
                "min-h-[96px] p-1 border-b border-r border-border flex flex-col gap-1",
                !isCurrentMonth && "bg-accent/30",
                // Remove right border on last column
                (idx + 1) % 7 === 0 && "border-r-0"
              )}
            >
              {/* Day number */}
              <div className="flex items-center justify-end">
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                    todayHighlight
                      ? "bg-primary text-primary-foreground font-bold"
                      : isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Task chips */}
              {visibleTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick(task.id);
                  }}
                  className={cn(
                    "w-full text-left text-xs px-1.5 py-0.5 rounded truncate font-medium",
                    "hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    getTaskChipColor(task)
                  )}
                  title={task.title}
                >
                  {task.title}
                </button>
              ))}

              {/* Overflow indicator */}
              {overflowCount > 0 && (
                <span className="text-xs text-muted-foreground px-1">
                  +{overflowCount} more
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
