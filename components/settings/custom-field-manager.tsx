"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical } from "lucide-react";

const FIELD_TYPES = [
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "DATE", label: "Date" },
  { value: "SELECT", label: "Dropdown" },
  { value: "CHECKBOX", label: "Checkbox" },
];

interface FieldDef {
  id: string;
  name: string;
  type: string;
  options: string | null;
  order: number;
}

export function CustomFieldManager({ boardId, initial }: { boardId: string; initial: FieldDef[] }) {
  const [fields, setFields] = useState<FieldDef[]>(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "TEXT", optionsRaw: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleCreate() {
    if (!form.name) return;
    setSaving(true);
    const options = form.type === "SELECT"
      ? form.optionsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const res = await fetch(`/api/boards/${boardId}/custom-fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, type: form.type, options }),
    });
    if (res.ok) {
      const field = await res.json();
      setFields((prev) => [...prev, field]);
      setForm({ name: "", type: "TEXT", optionsRaw: "" });
      setDialogOpen(false);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/boards/${boardId}/custom-fields/${id}`, { method: "DELETE" });
    setFields((prev) => prev.filter((f) => f.id !== id));
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Custom Fields</h2>
          <p className="text-sm text-muted-foreground">Add extra fields to tasks on this board.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
          No custom fields yet. Add one to extend task data.
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field) => {
            const options = field.options ? (JSON.parse(field.options) as string[]) : [];
            return (
              <div key={field.id} className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 bg-card">
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{field.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}</span>
                  {options.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">({options.join(", ")})</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive flex-shrink-0"
                  onClick={() => handleDelete(field.id)}
                  disabled={deleting === field.id}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Field Name</label>
              <Input placeholder="Story Points" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {form.type === "SELECT" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Options (comma-separated)</label>
                <Input placeholder="Option A, Option B, Option C" value={form.optionsRaw} onChange={(e) => setForm((f) => ({ ...f, optionsRaw: e.target.value }))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name}>
              {saving ? "Creating..." : "Add Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
