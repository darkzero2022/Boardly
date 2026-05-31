"use client";

import { useState, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./task-card";
import { NewTaskDialog } from "./new-task-dialog";
import { AlertTriangle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column {
  id: string;
  name: string;
  color: string;
  wipLimit?: number | null;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  slaStatus: string;
  slaDeadline: Date | string | null;
  dueDate: Date | string | null;
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
  canEdit?: boolean;
  bulkMode?: boolean;
  selectedTasks?: Set<string>;
  onSelect?: (taskId: string, selected: boolean) => void;
}

export function KanbanColumn({
  column,
  boardId,
  users,
  labels,
  onTaskClick,
  onTaskCreated,
  canEdit,
  bulkMode,
  selectedTasks,
  onSelect,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [columnName, setColumnName] = useState(column.name);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(column.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const taskIds = column.tasks.map((t) => t.id);

  function startEditing() {
    if (!canEdit) return;
    setEditValue(columnName);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function commitRename() {
    const trimmed = editValue.trim();
    setEditing(false);
    if (!trimmed || trimmed === columnName) return;
    setColumnName(trimmed);
    await fetch(`/api/columns/${column.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") { setEditing(false); setEditValue(columnName); }
  }

  return (
    <div
      className={cn(
        "flex flex-col w-72 shrink-0 bg-muted/50 rounded-xl",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: column.color }}
          />

          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleKeyDown}
              className="text-sm font-semibold bg-background border border-primary rounded px-1.5 py-0.5 outline-none w-full"
              maxLength={100}
              autoFocus
            />
          ) : (
            <h3
              className={cn(
                "text-sm font-semibold truncate",
                canEdit && "cursor-pointer hover:text-primary transition-colors"
              )}
              onDoubleClick={startEditing}
              title={canEdit ? "Double-click to rename" : columnName}
            >
              {columnName}
            </h3>
          )}

          {column.wipLimit ? (
            <span className={cn(
              "text-xs rounded-full px-2 flex items-center gap-1 shrink-0",
              column.tasks.length >= column.wipLimit
                ? "text-red-500 bg-red-100 dark:bg-red-950"
                : column.tasks.length >= column.wipLimit * 0.8
                ? "text-orange-500 bg-orange-100 dark:bg-orange-950"
                : "text-muted-foreground bg-muted"
            )}>
              {column.tasks.length >= column.wipLimit && <AlertTriangle className="w-3 h-3" />}
              {column.tasks.length}/{column.wipLimit}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 shrink-0">
              {column.tasks.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 ml-1">
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
            <TaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
              selected={selectedTasks?.has(task.id)}
              onSelect={bulkMode ? onSelect : undefined}
            />
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
