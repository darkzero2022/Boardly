"use client";

import { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";

interface BoardTemplate {
  id: string;
  name: string;
  description: string | null;
  _count?: { columns: number };
}

interface TemplatePicerkDialogProps {
  workspaceId: string;
  trigger: React.ReactNode;
  onCreated: (board: { id: string }) => void;
}

export function TemplatePickerDialog({ workspaceId, trigger, onCreated }: TemplatePicerkDialogProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<BoardTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [boardName, setBoardName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedId(null);
    setBoardName("");
    setError(null);
    fetch("/api/board-templates")
      .then((r) => r.json())
      .then((data) => setTemplates(Array.isArray(data) ? data : data.templates ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !boardName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/board-templates/${selectedId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: boardName.trim(), workspaceId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create board");
      }
      const board = await res.json();
      onCreated(board);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create board from template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Template list */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Choose a template</span>
            {loading ? (
              <div className="text-sm text-muted-foreground py-4 text-center">Loading templates…</div>
            ) : templates.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">No templates found.</div>
            ) : (
              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto border border-border rounded-md divide-y divide-border">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedId(tpl.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 hover:bg-accent transition-colors",
                      selectedId === tpl.id && "bg-primary/10"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{tpl.name}</span>
                      {tpl._count?.columns != null && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {tpl._count.columns} column{tpl._count.columns !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {tpl.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {tpl.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Board name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-board-name" className="text-sm font-medium">
              Board name
            </label>
            <Input
              id="new-board-name"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="My new board"
              required
              disabled={!selectedId}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedId || !boardName.trim()}
            >
              {submitting ? "Creating…" : "Create board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
