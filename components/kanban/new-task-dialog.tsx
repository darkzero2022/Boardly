"use client";

import { useState } from "react";
import { TaskTemplatePicker } from "@/components/task-templates/task-template-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewTaskDialogProps {
  columnId: string;
  boardId: string;
  users: { id: string; name: string | null; image: string | null }[];
  labels: { id: string; name: string; color: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCreated: (task: any) => void;
  trigger: React.ReactNode;
}

export function NewTaskDialog({
  columnId,
  boardId,
  users,
  labels,
  onCreated,
  trigger,
}: NewTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        columnId,
        boardId,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
        labelIds: selectedLabels,
      }),
    });

    setLoading(false);

    if (res.ok) {
      const task = await res.json();
      onCreated(task);
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setAssigneeId("");
      setDueDate("");
      setSelectedLabels([]);
      setOpen(false);
    }
  }

  function toggleLabel(id: string) {
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TaskTemplatePicker
            onSelect={(tpl) => {
              if (!title) setTitle(tpl.name);
              setDescription(tpl.description || "");
              setPriority(tpl.priority);
              setSelectedLabels(tpl.labelIds);
            }}
          />
          <div>
            <Input
              placeholder="Task title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <Textarea
              placeholder="Description (supports @mentions)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Priority
              </label>
              <Select value={priority} onValueChange={setPriority}>
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
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Assignee
              </label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
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
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Due Date
            </label>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          {labels.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {labels.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => toggleLabel(l.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                    style={{
                      backgroundColor: selectedLabels.includes(l.id)
                        ? l.color
                        : "transparent",
                      borderColor: l.color,
                      color: selectedLabels.includes(l.id) ? "white" : l.color,
                    }}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
