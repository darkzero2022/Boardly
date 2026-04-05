"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { Clock } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { name: string | null };
}

export function AuditTimeline({ taskId }: { taskId: string }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/audit`)
      .then((r) => r.json())
      .then(setLogs);
  }, [taskId]);

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No history yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-3 h-3 text-primary" />
            </div>
            <div className="w-px flex-1 bg-border mt-1" />
          </div>
          <div className="flex-1 pb-3">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium">{log.user.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(log.createdAt)}
              </span>
            </div>
            <p className="text-sm text-foreground">
              <span className="font-medium">{log.action}</span>
              {log.field && (
                <span className="text-muted-foreground"> · {log.field}</span>
              )}
            </p>
            {log.oldValue !== null && log.newValue !== null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="line-through">{log.oldValue}</span>
                {" → "}
                <span className="font-medium">{log.newValue}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
