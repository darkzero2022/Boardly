"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  priority: string;
  labelIds: string[];
}

interface TaskTemplatePickerProps {
  onSelect: (template: TaskTemplate) => void;
}

export function TaskTemplatePicker({ onSelect }: TaskTemplatePickerProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/task-templates")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setTemplates(data))
      .catch(() => {});
  }, []);

  if (templates.length === 0) return null;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={() => setOpen((o) => !o)}
      >
        Use Template
      </Button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg min-w-[200px]">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg"
              onClick={() => {
                onSelect(tpl);
                setOpen(false);
              }}
            >
              <p className="font-medium">{tpl.name}</p>
              {tpl.description && (
                <p className="text-xs text-muted-foreground truncate">{tpl.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
