"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn, priorityColor, slaStatusColor, formatDate } from "@/lib/utils";
import { MessageSquare, Paperclip, GitBranch, Clock, AlertTriangle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
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

interface TaskCardProps {
  task: Task;
  onClick: (taskId: string) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBreached = task.slaStatus === "BREACHED";
  const isAtRisk = task.slaStatus === "AT_RISK";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task.id)}
      className={cn(
        "bg-card border border-border rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all group select-none",
        (isSortableDragging || isDragging) && "opacity-40 shadow-lg",
        isBreached && "border-l-4 border-l-red-500",
        isAtRisk && !isBreached && "border-l-4 border-l-yellow-500"
      )}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((tl) => (
            <span
              key={tl.labelId}
              className="inline-block text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: tl.label.color }}
            >
              {tl.label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
        {task.title}
      </p>

      {/* SLA Warning */}
      {(isBreached || isAtRisk) && (
        <div
          className={cn(
            "flex items-center gap-1 mt-1.5 text-xs font-medium",
            slaStatusColor(task.slaStatus)
          )}
        >
          <AlertTriangle className="w-3 h-3" />
          {isBreached ? "SLA Breached" : "At Risk"}{" "}
          {task.slaDeadline && `· ${formatDate(task.slaDeadline)}`}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-2">
          {/* Priority badge */}
          <span
            className={cn(
              "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border",
              priorityColor(task.priority as never)
            )}
          >
            {task.priority[0]}
          </span>

          {/* Counts */}
          {task._count.comments > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              {task._count.comments}
            </span>
          )}
          {task._count.subtasks > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <GitBranch className="w-3 h-3" />
              {task._count.subtasks}
            </span>
          )}
          {task._count.attachments > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Paperclip className="w-3 h-3" />
              {task._count.attachments}
            </span>
          )}
        </div>

        {/* Assignee avatar */}
        {task.assignee && (
          <div
            className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden"
            title={task.assignee.name ?? ""}
          >
            {task.assignee.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={task.assignee.image}
                alt={task.assignee.name ?? ""}
                className="w-full h-full object-cover"
              />
            ) : (
              (task.assignee.name ?? "?")[0].toUpperCase()
            )}
          </div>
        )}
      </div>
    </div>
  );
}
