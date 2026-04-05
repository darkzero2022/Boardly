"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function BoardFilters({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        <Filter className="w-3.5 h-3.5 mr-1.5" />
        Filters
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-40 w-72 bg-popover border border-border rounded-xl shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Filter Tasks</h3>
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use the filter controls to narrow down tasks by assignee, label, priority, or SLA status.
            </p>
            <div className="mt-3 space-y-2">
              {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  {p}
                </label>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">SLA Status</p>
              {["OK", "AT_RISK", "BREACHED"].map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  {s}
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
