"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { TaskDetailDrawer } from "./task-detail-drawer";
import { NewColumnButton } from "./new-column-button";
import { useSocketContext } from "@/components/socket-provider";
import { SOCKET_EVENTS } from "@/lib/socket";
import { Plus } from "lucide-react";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface TaskLabel {
  labelId: string;
  label: Label;
}

interface User {
  id: string;
  name: string | null;
  image: string | null;
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
  assignee: User | null;
  labels: TaskLabel[];
  _count: { subtasks: number; comments: number; attachments: number };
}

interface Column {
  id: string;
  name: string;
  color: string;
  order: number;
  tasks: Task[];
}

interface Board {
  id: string;
  name: string;
  columns: Column[];
}

interface KanbanBoardProps {
  board: Board;
  users: User[];
  labels: Label[];
  openTaskId?: string;
  currentUserId: string;
}

export function KanbanBoard({
  board,
  users,
  labels,
  openTaskId,
  currentUserId,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(board.columns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    openTaskId ?? null
  );

  const { socket, joinBoard, leaveBoard } = useSocketContext();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Join board Socket.io room for real-time
  useEffect(() => {
    joinBoard(board.id);
    return () => leaveBoard(board.id);
  }, [board.id, joinBoard, leaveBoard]);

  // Listen for real-time task events
  useEffect(() => {
    if (!socket) return;

    socket.on(SOCKET_EVENTS.TASK_MOVED, (data: { taskId: string; columnId: string; order: number }) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks
            .map((t) => t.id === data.taskId ? { ...t, columnId: data.columnId, order: data.order } : t)
            .filter((t) => !(t.id === data.taskId && col.id !== data.columnId)),
        }))
      );
    });

    socket.on(SOCKET_EVENTS.TASK_CREATED, (task: Task) => {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === task.columnId
            ? { ...col, tasks: [...col.tasks, task] }
            : col
        )
      );
    });

    socket.on(SOCKET_EVENTS.TASK_UPDATED, (task: Task) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t)),
        }))
      );
    });

    socket.on(SOCKET_EVENTS.TASK_DELETED, ({ taskId }: { taskId: string }) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId),
        }))
      );
    });

    return () => {
      socket.off(SOCKET_EVENTS.TASK_MOVED);
      socket.off(SOCKET_EVENTS.TASK_CREATED);
      socket.off(SOCKET_EVENTS.TASK_UPDATED);
      socket.off(SOCKET_EVENTS.TASK_DELETED);
    };
  }, [socket]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = columns
      .flatMap((c) => c.tasks)
      .find((t) => t.id === active.id);
    setActiveTask(task ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCol = columns.find((c) => c.tasks.some((t) => t.id === active.id));
    const overCol = columns.find(
      (c) => c.id === over.id || c.tasks.some((t) => t.id === over.id)
    );

    if (!activeCol || !overCol || activeCol.id === overCol.id) return;

    setColumns((prev) => {
      const task = activeCol.tasks.find((t) => t.id === active.id)!;
      return prev.map((col) => {
        if (col.id === activeCol.id) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== active.id) };
        }
        if (col.id === overCol.id) {
          return { ...col, tasks: [...col.tasks, { ...task, columnId: col.id }] };
        }
        return col;
      });
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const col = columns.find((c) => c.tasks.some((t) => t.id === active.id));
    if (!col) return;

    const oldIndex = col.tasks.findIndex((t) => t.id === active.id);
    const newIndex = col.tasks.findIndex((t) => t.id === over.id);

    if (oldIndex !== newIndex) {
      const reordered = arrayMove(col.tasks, oldIndex, newIndex);
      setColumns((prev) =>
        prev.map((c) => (c.id === col.id ? { ...c, tasks: reordered } : c))
      );
    }

    // Persist to API
    await fetch(`/api/tasks/${active.id}/move`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        columnId: col.id,
        order: newIndex,
        boardId: board.id,
      }),
    });
  }

  function onTaskCreated(task: Task) {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === task.columnId
          ? { ...col, tasks: [...col.tasks, task] }
          : col
      )
    );
  }

  function onColumnCreated(col: Column) {
    setColumns((prev) => [...prev, { ...col, tasks: [] }]);
  }

  const selectedTask = columns.flatMap((c) => c.tasks).find((t) => t.id === selectedTaskId) ?? null;

  return (
    <div className="flex-1 flex overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-6 overflow-x-auto flex-1">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              column={column as any}
              boardId={board.id}
              users={users}
              labels={labels}
              onTaskClick={(taskId) => setSelectedTaskId(taskId)}
              onTaskCreated={onTaskCreated}
            />
          ))}
          <NewColumnButton boardId={board.id} onCreated={onColumnCreated} />
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="rotate-2 scale-105 opacity-90">
              <TaskCard
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                task={activeTask as any}
                onClick={() => {}}
                isDragging
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailDrawer
          taskId={selectedTaskId!}
          boardId={board.id}
          users={users}
          labels={labels}
          currentUserId={currentUserId}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={(updated) => {
            setColumns((prev) =>
              prev.map((col) => ({
                ...col,
                tasks: col.tasks.map((t) =>
                  t.id === updated.id ? { ...t, ...updated } : t
                ),
              }))
            );
          }}
          onDeleted={(taskId) => {
            setColumns((prev) =>
              prev.map((col) => ({
                ...col,
                tasks: col.tasks.filter((t) => t.id !== taskId),
              }))
            );
            setSelectedTaskId(null);
          }}
        />
      )}
    </div>
  );
}
