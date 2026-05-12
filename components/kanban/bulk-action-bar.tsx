"use client";

import { X, MoveRight, UserPlus, Tag, Trash2, ChevronUp, Flag } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  selectedCount: number;
  columns: { id: string; name: string }[];
  onMove: (columnId: string) => void;
  onAssign: () => void;
  onLabelAdd: () => void;
  onPriority: (priority: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkActionBar({
  selectedCount,
  columns,
  onMove,
  onAssign,
  onLabelAdd,
  onPriority,
  onDelete,
  onClear,
}: BulkActionBarProps) {
  const visible = selectedCount > 0;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3",
        "bg-primary text-primary-foreground shadow-lg",
        "transition-transform duration-200 ease-in-out",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      aria-hidden={!visible}
      role="toolbar"
      aria-label="Bulk task actions"
    >
      {/* Left: count + clear */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold">
          {selectedCount} {selectedCount === 1 ? "task" : "tasks"} selected
        </span>
        <button
          onClick={onClear}
          className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-primary-foreground/20 transition-colors"
          aria-label="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-2">
        {/* Move to → dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                "bg-primary-foreground/15 hover:bg-primary-foreground/25 transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50"
              )}
            >
              <MoveRight className="w-4 h-4" />
              Move to
              <ChevronUp className="w-3 h-3 opacity-70" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align="end"
              sideOffset={8}
              className={cn(
                "z-50 min-w-[160px] rounded-md border border-border bg-card shadow-md",
                "p-1 text-sm text-foreground",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                "data-[side=top]:slide-in-from-bottom-2"
              )}
            >
              <DropdownMenu.Label className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Move to column
              </DropdownMenu.Label>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              {columns.length === 0 ? (
                <DropdownMenu.Item
                  disabled
                  className="px-2 py-1.5 text-muted-foreground text-xs"
                >
                  No columns available
                </DropdownMenu.Item>
              ) : (
                columns.map((col) => (
                  <DropdownMenu.Item
                    key={col.id}
                    onSelect={() => onMove(col.id)}
                    className={cn(
                      "flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer",
                      "hover:bg-accent focus:bg-accent focus:outline-none transition-colors"
                    )}
                  >
                    {col.name}
                  </DropdownMenu.Item>
                ))
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Assign */}
        <button
          onClick={onAssign}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
            "bg-primary-foreground/15 hover:bg-primary-foreground/25 transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50"
          )}
        >
          <UserPlus className="w-4 h-4" />
          Assign
        </button>

        {/* Add Label */}
        <button
          onClick={onLabelAdd}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
            "bg-primary-foreground/15 hover:bg-primary-foreground/25 transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50"
          )}
        >
          <Tag className="w-4 h-4" />
          Add Label
        </button>

        {/* Set Priority */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                "bg-primary-foreground/15 hover:bg-primary-foreground/25 transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50"
              )}
            >
              <Flag className="w-4 h-4" />
              Priority
              <ChevronUp className="w-3 h-3 opacity-70" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content side="top" align="end" sideOffset={8}
              className="z-50 min-w-[140px] rounded-md border border-border bg-card shadow-md p-1 text-sm text-foreground">
              <DropdownMenu.Label className="px-2 py-1 text-xs font-medium text-muted-foreground">Set priority</DropdownMenu.Label>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
                <DropdownMenu.Item key={p} onSelect={() => onPriority(p)}
                  className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer hover:bg-accent focus:bg-accent focus:outline-none">
                  <span className={`w-2 h-2 rounded-full ${p === "CRITICAL" ? "bg-red-500" : p === "HIGH" ? "bg-orange-500" : p === "MEDIUM" ? "bg-blue-500" : "bg-gray-400"}`} />
                  {p}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Delete */}
        <button
          onClick={onDelete}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
            "bg-red-600 hover:bg-red-700 text-white transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          )}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}
