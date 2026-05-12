"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Trash2, Clock, AlertTriangle, Paperclip, MessageSquare, GitBranch, History, Eye, EyeOff, Link2, UploadCloud, Download, Lock, Plus, Search } from "lucide-react";
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

interface DepTask { id: string; title: string; dependsOnId?: string; taskId?: string; dependsOn?: { title: string }; task?: { title: string } }
interface Attachment { id: string; filename: string; originalName: string; mimeType: string; size: number; path: string; createdAt: string; uploadedBy: { name: string | null } }
interface TimeLogEntry { id: string; minutes: number; note: string | null; startedAt: string; user: { id: string; name: string | null; image: string | null } }

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

type ActiveTab = "details" | "comments" | "history" | "subtasks" | "attachments" | "time" | "dependencies" | "fields";

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
  const [watching, setWatching] = useState(false);
  const [watchCount, setWatchCount] = useState(0);
  const [dependencies, setDependencies] = useState<{ blocks: DepTask[]; blockedBy: DepTask[] }>({ blocks: [], blockedBy: [] });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [timeLogs, setTimeLogs] = useState<TimeLogEntry[]>([]);
  const [logMinutes, setLogMinutes] = useState("");
  const [logNote, setLogNote] = useState("");
  const [loggingTime, setLoggingTime] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<{ id: string; fieldId: string; value: string | null; field: { id: string; name: string; type: string; options: string | null } }[]>([]);

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
    fetch(`/api/tasks/${taskId}/watch`)
      .then((r) => r.json())
      .then((d) => { setWatching(d.watching); setWatchCount(d.count); })
      .catch(() => {});
    fetch(`/api/tasks/${taskId}/dependencies`)
      .then((r) => r.json())
      .then((d) => setDependencies(d))
      .catch(() => {});
    fetch(`/api/tasks/${taskId}/attachments`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setAttachments(d))
      .catch(() => {});
    fetch(`/api/tasks/${taskId}/timelogs`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setTimeLogs(d))
      .catch(() => {});
    fetch(`/api/tasks/${taskId}/custom-fields`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setCustomFieldValues(d))
      .catch(() => {});
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

  async function toggleWatch() {
    const method = watching ? "DELETE" : "POST";
    const res = await fetch(`/api/tasks/${taskId}/watch`, { method });
    if (res.ok) {
      const d = await res.json();
      setWatching(d.watching);
      setWatchCount(d.count);
    }
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/tasks/${taskId}/attachments`, { method: "POST", body: fd });
    if (res.ok) {
      const att = await res.json();
      setAttachments((prev) => [...prev, att]);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function deleteAttachment(attachId: string) {
    await fetch(`/api/tasks/${taskId}/attachments/${attachId}`, { method: "DELETE" });
    setAttachments((prev) => prev.filter((a) => a.id !== attachId));
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

  async function logTime() {
    const mins = parseInt(logMinutes);
    if (!mins || mins <= 0) return;
    setLoggingTime(true);
    const res = await fetch(`/api/tasks/${taskId}/timelogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes: mins, note: logNote || undefined }),
    });
    if (res.ok) {
      const entry = await res.json();
      setTimeLogs((prev) => [...prev, entry]);
      setLogMinutes("");
      setLogNote("");
    }
    setLoggingTime(false);
  }

  async function deleteTimeLog(logId: string) {
    await fetch(`/api/tasks/${taskId}/timelogs/${logId}`, { method: "DELETE" });
    setTimeLogs((prev) => prev.filter((l) => l.id !== logId));
  }

  const totalMinutes = timeLogs.reduce((sum, l) => sum + l.minutes, 0);
  const totalTime = totalMinutes >= 60
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
    : `${totalMinutes}m`;

  const depCount = dependencies.blocks.length + dependencies.blockedBy.length;
  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "details", label: "Details" },
    { key: "comments", label: "Comments" },
    { key: "subtasks", label: "Subtasks" },
    { key: "dependencies", label: `Dependencies${depCount > 0 ? ` (${depCount})` : ""}` },
    { key: "attachments", label: `Attachments${attachments.length > 0 ? ` (${attachments.length})` : ""}` },
    { key: "time", label: `Time${timeLogs.length > 0 ? ` (${totalTime})` : ""}` },
    { key: "history", label: "History" },
    { key: "fields", label: `Fields${customFieldValues.length > 0 ? ` (${customFieldValues.length})` : ""}` },
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
              size="sm"
              variant={watching ? "default" : "outline"}
              onClick={toggleWatch}
              title={watching ? "Stop watching" : "Watch task"}
              className="gap-1.5"
            >
              {watching ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="text-xs">{watchCount > 0 ? watchCount : ""}</span>
            </Button>
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

                  {/* Dependencies */}
                  {(dependencies.blocks.length > 0 || dependencies.blockedBy.length > 0) && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        Dependencies
                      </label>
                      {dependencies.blockedBy.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground mb-1">Blocked by</p>
                          {dependencies.blockedBy.map((dep: DepTask) => (
                            <div key={dep.id} className="flex items-center gap-2 text-sm p-1.5 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 mb-1">
                              <Lock className="w-3 h-3 text-red-500" />
                              <span>{dep.dependsOn?.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {dependencies.blocks.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Blocks</p>
                          {dependencies.blocks.map((dep: DepTask) => (
                            <div key={dep.id} className="flex items-center gap-2 text-sm p-1.5 rounded bg-muted mb-1">
                              <Link2 className="w-3 h-3 text-muted-foreground" />
                              <span>{dep.task?.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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

              {activeTab === "attachments" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Attachments ({attachments.length})</h3>
                    <div>
                      <input ref={fileInputRef} type="file" className="hidden" onChange={uploadFile} />
                      <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                        {uploading ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                  </div>
                  {attachments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No attachments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((att) => (
                        <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                          <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{att.originalName}</p>
                            <p className="text-xs text-muted-foreground">
                              {(att.size / 1024).toFixed(1)} KB · {att.uploadedBy?.name} · {timeAgo(att.createdAt)}
                            </p>
                          </div>
                          <a href={`/${att.path}`} download={att.originalName} className="p-1.5 hover:bg-accent rounded">
                            <Download className="w-3.5 h-3.5 text-muted-foreground" />
                          </a>
                          <button onClick={() => deleteAttachment(att.id)} className="p-1.5 hover:bg-destructive/10 rounded text-destructive">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "time" && (
                <div className="p-6 space-y-4">
                  {totalMinutes > 0 && (
                    <div className="text-sm font-medium text-foreground bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      Total logged: <span className="font-bold">{totalTime}</span>
                    </div>
                  )}

                  {/* Log time form */}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Minutes"
                      value={logMinutes}
                      onChange={(e) => setLogMinutes(e.target.value)}
                      className="w-28"
                      min={1}
                    />
                    <Input
                      placeholder="Note (optional)"
                      value={logNote}
                      onChange={(e) => setLogNote(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={logTime} disabled={loggingTime || !logMinutes}>
                      {loggingTime ? "..." : "Log"}
                    </Button>
                  </div>

                  {/* Time log list */}
                  <div className="space-y-2">
                    {timeLogs.length === 0 && (
                      <p className="text-sm text-muted-foreground">No time logged yet.</p>
                    )}
                    {timeLogs.map((log) => (
                      <div key={log.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {(log.user.name ?? "?")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{log.user.name ?? "Unknown"}</span>
                              <span className="text-xs font-semibold text-primary">{log.minutes}m</span>
                            </div>
                            {log.note && <p className="text-xs text-muted-foreground truncate">{log.note}</p>}
                            <p className="text-xs text-muted-foreground">{timeAgo(log.startedAt)}</p>
                          </div>
                        </div>
                        {log.user.id === currentUserId && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => deleteTimeLog(log.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "dependencies" && (
                <div className="p-6">
                  <DependenciesPanel
                    taskId={taskId}
                    boardId={boardId}
                    dependencies={dependencies}
                    onChanged={setDependencies}
                  />
                </div>
              )}

              {activeTab === "fields" && (
                <div className="p-6">
                  <CustomFieldsPanel
                    taskId={taskId}
                    boardId={boardId}
                    values={customFieldValues}
                    onChanged={setCustomFieldValues}
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

// Dependencies panel with add/remove
function DependenciesPanel({
  taskId,
  boardId,
  dependencies,
  onChanged,
}: {
  taskId: string;
  boardId: string;
  dependencies: { blocks: DepTask[]; blockedBy: DepTask[] };
  onChanged: (d: { blocks: DepTask[]; blockedBy: DepTask[] }) => void;
}) {
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; title: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSearchResults((data.tasks ?? []).filter((t: { id: string }) => t.id !== taskId));
    setSearching(false);
  }, [taskId]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(searchQ), 280);
    return () => clearTimeout(t);
  }, [searchQ, doSearch]);

  async function addBlock(dependsOnId: string) {
    const res = await fetch(`/api/tasks/${taskId}/dependencies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dependsOnId }),
    });
    if (res.ok) {
      const dep = await res.json();
      onChanged({ ...dependencies, blocks: [...dependencies.blocks, dep] });
      setSearchQ("");
      setSearchResults([]);
      setAdding(false);
    }
  }

  async function removeBlock(dependsOnId: string) {
    await fetch(`/api/tasks/${taskId}/dependencies`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dependsOnId }),
    });
    onChanged({ ...dependencies, blocks: dependencies.blocks.filter(d => d.dependsOnId !== dependsOnId && d.dependsOn?.title !== undefined ? d.dependsOnId !== dependsOnId : true) });
    // Refetch to be safe
    const fresh = await fetch(`/api/tasks/${taskId}/dependencies`).then(r => r.json());
    onChanged(fresh);
  }

  return (
    <div className="space-y-4">
      {/* Blocked By */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Blocked By</p>
        {dependencies.blockedBy.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blockers.</p>
        ) : (
          <div className="space-y-1">
            {dependencies.blockedBy.map(dep => (
              <div key={dep.id} className="flex items-center gap-2 p-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 text-sm">
                <Lock className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <span className="flex-1 truncate">{dep.dependsOn?.title ?? dep.task?.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blocks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blocks</p>
          <Button size="sm" variant="outline" onClick={() => setAdding(v => !v)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
        {dependencies.blocks.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">This task blocks nothing.</p>
        )}
        <div className="space-y-1 mb-2">
          {dependencies.blocks.map(dep => (
            <div key={dep.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/50 text-sm">
              <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 truncate">{dep.dependsOn?.title ?? dep.task?.title}</span>
              <button
                onClick={() => removeBlock(dep.dependsOnId ?? dep.id)}
                className="p-1 hover:bg-destructive/10 rounded text-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {adding && (
          <div className="relative">
            <div className="flex items-center gap-2 p-2 border border-border rounded-lg bg-background">
              <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <input
                autoFocus
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search tasks to block…"
                className="flex-1 text-sm bg-transparent outline-none"
              />
              {searching && <span className="text-xs text-muted-foreground">…</span>}
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                {searchResults.slice(0, 6).map(t => (
                  <button
                    key={t.id}
                    onClick={() => addBlock(t.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors truncate"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
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

type CFValue = { id: string; fieldId: string; value: string | null; field: { id: string; name: string; type: string; options: string | null } };

function CustomFieldsPanel({
  taskId,
  boardId,
  values,
  onChanged,
}: {
  taskId: string;
  boardId: string;
  values: CFValue[];
  onChanged: (v: CFValue[]) => void;
}) {
  const [fieldDefs, setFieldDefs] = useState<{ id: string; name: string; type: string; options: string | null }[]>([]);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/boards/${boardId}/custom-fields`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setFieldDefs(d))
      .catch(() => {});
    const map: Record<string, string> = {};
    for (const v of values) map[v.fieldId] = v.value ?? "";
    setLocalValues(map);
  }, [boardId, values]);

  async function saveField(fieldId: string, value: string) {
    setLocalValues((prev) => ({ ...prev, [fieldId]: value }));
    setSaving(true);
    const res = await fetch(`/api/tasks/${taskId}/custom-fields`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values: [{ fieldId, value }] }),
    });
    if (res.ok) {
      const updated = await res.json();
      onChanged(updated);
    }
    setSaving(false);
  }

  if (fieldDefs.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        <p>No custom fields defined for this board.</p>
        <p className="mt-1 text-xs">Admins can add fields in board settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Custom Fields</h3>
        {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
      </div>
      {fieldDefs.map((field) => {
        const val = localValues[field.id] ?? "";
        const options = field.options ? (JSON.parse(field.options) as string[]) : [];
        return (
          <div key={field.id}>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{field.name}</label>
            {field.type === "TEXT" && (
              <Input value={val} onChange={(e) => setLocalValues((p) => ({ ...p, [field.id]: e.target.value }))} onBlur={(e) => saveField(field.id, e.target.value)} placeholder="Enter text..." />
            )}
            {field.type === "NUMBER" && (
              <Input type="number" value={val} onChange={(e) => setLocalValues((p) => ({ ...p, [field.id]: e.target.value }))} onBlur={(e) => saveField(field.id, e.target.value)} placeholder="0" />
            )}
            {field.type === "DATE" && (
              <Input type="date" value={val} onChange={(e) => saveField(field.id, e.target.value)} />
            )}
            {field.type === "CHECKBOX" && (
              <input type="checkbox" checked={val === "true"} onChange={(e) => saveField(field.id, e.target.checked ? "true" : "false")} className="w-4 h-4" />
            )}
            {field.type === "SELECT" && (
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={val} onChange={(e) => saveField(field.id, e.target.value)}>
                <option value="">Select...</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}
