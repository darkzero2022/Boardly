"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Clock, AlertTriangle, Paperclip, MessageSquare, GitBranch, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate, slaStatusColor, timeAgo } from "@/lib/utils";
import { CommentThread } from "./comment-thread";
import { AuditTimeline } from "./audit-timeline";

interface User { id: string; name: string | null; image: string | null }
interface Label { id: string; name: string; color: string }

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  slaStatus: string;
  slaDeadline: string | null;
  dueDate: string | null;
  isRecurring: boolean;
  recurrenceRule: string | null;
  columnId: string;
  boardId: string;
  assignee: User | null;
  reporter: User | null;
  labels: { labelId: string; label: Label }[];
  subtasks: { id: string; title: string; slaStatus: string; columnId: string }[];
  createdAt: string;
  updatedAt: string;
}

interface TaskDetailDrawerProps {
  taskId: string;
  boardId: string;
  users: User[];
  labels: Label[];
  currentUserId: string;
  onClose: () => void;
  onUpdated: (task: Partial<TaskDetail> & { id: string }) => void;
  onDeleted: (taskId: string) => void;
}

type ActiveTab = "details" | "comments" | "history" | "subtasks";

export function TaskDetailDrawer({
  taskId,
  boardId,
  users,
  labels,
  currentUserId,
  onClose,
  onUpdated,
  onDeleted,
}: TaskDetailDrawerProps) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("details");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "",
    assigneeId: "",
    dueDate: "",
  });

  useEffect(() => {
    fetch(`/api/tasks/${taskId}`)
      .then((r) => r.json())
      .then((data) => {
        setTask(data);
        setForm({
          title: data.title,
          description: data.description ?? "",
          priority: data.priority,
          assigneeId: data.assignee?.id ?? "",
          dueDate: data.dueDate ? data.dueDate.slice(0, 16) : "",
        });
      });
  }, [taskId]);

  async function handleSave() {
    if (!task) return;
    setSaving(true);
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      setTask(updated);
      onUpdated(updated);
      setEditing(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    onDeleted(taskId);
  }

  async function toggleLabel(labelId: string) {
    const has = task?.labels.some((l) => l.labelId === labelId);
    const res = await fetch(`/api/tasks/${taskId}/labels`, {
      method: has ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelId }),
    });
    if (res.ok) {
      setTask((prev) =>
        prev
          ? {
              ...prev,
              labels: has
                ? prev.labels.filter((l) => l.labelId !== labelId)
                : [...prev.labels, { labelId, label: labels.find((l) => l.id === labelId)! }],
            }
          : prev
      );
    }
  }

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "details", label: "Details" },
    { key: "comments", label: "Comments" },
    { key: "subtasks", label: "Subtasks" },
    { key: "history", label: "History" },
  ];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[600px] bg-background border-l border-border flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            {task && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${slaStatusColor(task.slaStatus)}`}
              >
                {task.slaStatus}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              #{taskId.slice(-6)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!task ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Task title */}
            <div className="px-6 py-4">
              {editing ? (
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="text-lg font-semibold border-0 border-b p-0 rounded-none focus-visible:ring-0"
                />
              ) : (
                <h2 className="text-lg font-semibold">{task.title}</h2>
              )}

              {/* SLA warning banner */}
              {task.slaStatus !== "OK" && (
                <div
                  className={`flex items-center gap-2 mt-2 text-sm ${
                    task.slaStatus === "BREACHED"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  SLA deadline: {formatDate(task.slaDeadline)}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "details" && (
                <div className="p-6 space-y-5">
                  {/* Description */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Description
                    </label>
                    {editing ? (
                      <Textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, description: e.target.value }))
                        }
                        rows={4}
                        placeholder="Add a description..."
                      />
                    ) : (
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {task.description || (
                          <span className="text-muted-foreground italic">
                            No description
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Fields grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Priority
                      </label>
                      {editing ? (
                        <Select
                          value={form.priority}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, priority: v }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline">{task.priority}</Badge>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Assignee
                      </label>
                      {editing ? (
                        <Select
                          value={form.assigneeId}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, assigneeId: v }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm">
                          {task.assignee?.name ?? "Unassigned"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Due Date
                      </label>
                      {editing ? (
                        <Input
                          type="datetime-local"
                          value={form.dueDate}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, dueDate: e.target.value }))
                          }
                        />
                      ) : (
                        <p className="text-sm flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        SLA Deadline
                      </label>
                      <p className={`text-sm font-medium ${slaStatusColor(task.slaStatus)}`}>
                        {formatDate(task.slaDeadline)}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Reporter
                      </label>
                      <p className="text-sm">{task.reporter?.name ?? "—"}</p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Created
                      </label>
                      <p className="text-sm">{timeAgo(task.createdAt)}</p>
                    </div>
                  </div>

                  {/* Labels */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Labels
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {labels.map((l) => {
                        const active = task.labels.some((tl) => tl.labelId === l.id);
                        return (
                          <button
                            key={l.id}
                            onClick={() => toggleLabel(l.id)}
                            className="text-xs px-2.5 py-1 rounded-full border font-medium transition-all"
                            style={{
                              backgroundColor: active ? l.color : "transparent",
                              borderColor: l.color,
                              color: active ? "white" : l.color,
                            }}
                          >
                            {l.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recurring */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Recurring
                    </label>
                    <p className="text-sm">
                      {task.isRecurring ? task.recurrenceRule : "Not recurring"}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "comments" && (
                <div className="p-6">
                  <CommentThread taskId={taskId} currentUserId={currentUserId} />
                </div>
              )}

              {activeTab === "subtasks" && (
                <div className="p-6">
                  <SubtaskList
                    subtasks={task.subtasks}
                    taskId={taskId}
                    boardId={boardId}
                  />
                </div>
              )}

              {activeTab === "history" && (
                <div className="p-6">
                  <AuditTimeline taskId={taskId} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// Inline subtask list
function SubtaskList({
  subtasks,
  taskId,
  boardId,
}: {
  subtasks: { id: string; title: string; slaStatus: string }[];
  taskId: string;
  boardId: string;
}) {
  const [list, setList] = useState(subtasks);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  async function addSubtask() {
    if (!title.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, boardId, parentTaskId: taskId }),
    });
    if (res.ok) {
      const t = await res.json();
      setList((l) => [...l, t]);
      setTitle("");
      setAdding(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Subtasks ({list.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {list.map((s) => (
          <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border border-border text-sm">
            <span className={`w-2 h-2 rounded-full ${slaStatusColor(s.slaStatus)} bg-current`} />
            <span>{s.title}</span>
          </div>
        ))}
        {adding && (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Subtask title"
              onKeyDown={(e) => {
                if (e.key === "Enter") addSubtask();
                if (e.key === "Escape") setAdding(false);
              }}
            />
            <Button size="sm" onClick={addSubtask}>Add</Button>
          </div>
        )}
      </div>
    </div>
  );
}
