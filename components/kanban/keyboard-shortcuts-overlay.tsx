"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts: { keys: string[]; description: string }[] = [
  { keys: ["/", "Ctrl+K"], description: "Open search" },
  { keys: ["N"], description: "New task (in focused column)" },
  { keys: ["F"], description: "Toggle filters" },
  { keys: ["B"], description: "Toggle bulk select" },
  { keys: ["1", "2", "3"], description: "Switch view (Kanban / Calendar)" },
  { keys: ["Escape"], description: "Close dialogs" },
  { keys: ["?"], description: "Show this help" },
];

export function KeyboardShortcutsOverlay({ open, onClose }: KeyboardShortcutsOverlayProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h2>

        <div className="grid grid-cols-1 gap-2">
          {shortcuts.map(({ keys, description }) => (
            <div
              key={description}
              className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
            >
              <span className="text-sm text-muted-foreground">{description}</span>
              <div className="flex items-center gap-1">
                {keys.map((key, i) => (
                  <span key={key} className="flex items-center gap-1">
                    {i > 0 && (
                      <span className="text-xs text-muted-foreground">or</span>
                    )}
                    <kbd className="inline-flex items-center px-2 py-0.5 rounded border border-border bg-muted text-xs font-mono font-semibold text-foreground shadow-sm">
                      {key}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
