"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./task-card";
import { NewTaskDialog } from "./new-task-dialog";
import { MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column {
  id: string;
  name: string;
  color: string;
  tasks: Task[];
}

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

interface KanbanColumnProps {
  column: Column;
  boardId: string;
  users: { id: string; name: string | null; image: string | null }[];
  labels: { id: string; name: string; color: string }[];
  onTaskClick: (taskId: string) => void;
  onTaskCreated: (task: Task) => void;
}

export function KanbanColumn({
  column,
  boardId,
  users,
  labels,
  onTaskClick,
  onTaskCreated,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const taskIds = column.tasks.map((t) => t.id);

  return (
    <div
      className={cn(
        "flex flex-col w-72 shrink-0 bg-muted/50 rounded-xl",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="text-sm font-semibold">{column.name}</h3>
          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2">
            {column.tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <NewTaskDialog
            columnId={column.id}
            boardId={boardId}
            users={users}
            labels={labels}
            onCreated={onTaskCreated}
            trigger={
              <button className="p-1 rounded hover:bg-accent transition-colors">
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            }
          />
        </div>
      </div>

      {/* Task list */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex-1 px-2 pb-2 space-y-2 min-h-[120px] overflow-y-auto max-h-[calc(100vh-220px)]"
        >
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </div>
      </SortableContext>

      {/* Add task button at bottom */}
      <div className="px-2 pb-2">
        <NewTaskDialog
          columnId={column.id}
          boardId={boardId}
          users={users}
          labels={labels}
          onCreated={onTaskCreated}
          trigger={
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              Add task
            </button>
          }
        />
      </div>
    </div>
  );
}
