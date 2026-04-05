"use client";

import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NewColumnButtonProps {
  boardId: string;
  onCreated: (col: { id: string; name: string; color: string; order: number; tasks: [] }) => void;
}

export function NewColumnButton({ boardId, onCreated }: NewColumnButtonProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);

    const res = await fetch("/api/columns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), boardId }),
    });

    setLoading(false);
    if (res.ok) {
      const col = await res.json();
      onCreated({ ...col, tasks: [] });
      setName("");
      setAdding(false);
    }
  }

  if (!adding) {
    return (
      <div className="w-72 shrink-0">
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl border-2 border-dashed border-border transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add column
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 shrink-0 bg-muted/50 rounded-xl p-3 space-y-2">
      <Input
        autoFocus
        placeholder="Column name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreate();
          if (e.key === "Escape") setAdding(false);
        }}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleCreate} disabled={loading || !name.trim()}>
          <Check className="w-3.5 h-3.5 mr-1" />
          {loading ? "Adding..." : "Add"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
