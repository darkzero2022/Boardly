"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Trash2, Plus } from "lucide-react";

interface Label {
  id: string;
  name: string;
  color: string;
  _count: { tasks: number };
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
  "#0ea5e9", "#14b8a6", "#84cc16", "#a855f7",
];

export function LabelsManager({
  initialLabels,
  isAdmin,
}: {
  initialLabels: Label[];
  isAdmin: boolean;
}) {
  const [labels, setLabels] = useState(initialLabels);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [loading, setLoading] = useState(false);

  async function createLabel(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    setLoading(false);
    if (res.ok) {
      const label = await res.json();
      setLabels((l) => [...l, { ...label, _count: { tasks: 0 } }]);
      setName("");
      setColor("#6366f1");
      setShowCreate(false);
    }
  }

  async function deleteLabel(id: string) {
    if (!confirm("Delete this label? It will be removed from all tasks.")) return;
    const res = await fetch("/api/labels", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setLabels((l) => l.filter((lb) => lb.id !== id));
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreate((s) => !s)}>
          <Plus className="w-4 h-4 mr-1.5" />
          New Label
        </Button>
      </div>

      {showCreate && (
        <form
          onSubmit={createLabel}
          className="border border-border rounded-xl p-4 mb-4 space-y-3 bg-card"
        >
          <h3 className="text-sm font-semibold">Create Label</h3>
          <div className="flex gap-3">
            <Input
              placeholder="Label name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="flex-1"
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-9 rounded-md border border-input cursor-pointer"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? "hsl(var(--ring))" : "transparent",
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading || !name}>
              {loading ? "Creating..." : "Create"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {labels.map((label) => (
          <div
            key={label.id}
            className="flex items-center justify-between border border-border rounded-xl p-3 bg-card group"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: label.color }}
              />
              <div>
                <p className="text-sm font-medium">{label.name}</p>
                <p className="text-xs text-muted-foreground">
                  {label._count.tasks} tasks
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => deleteLabel(label.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
