"use client";

import { formatDistanceToNow } from "date-fns";

interface AuditLog {
  id: string;
  action: "CREATED" | "UPDATED" | "MOVED" | "DELETED" | string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string | Date;
  user: {
    name: string;
  };
  task: {
    id: string;
    title: string;
    boardId: string;
  } | null;
}

interface ActivityFeedProps {
  activities: AuditLog[];
}

function getActionText(log: AuditLog): string {
  switch (log.action) {
    case "CREATED":
      return `created ${log.task ? `"${log.task.title}"` : "a task"}`;
    case "UPDATED":
      if (log.field) {
        const from = log.oldValue ? ` from "${log.oldValue}"` : "";
        const to = log.newValue ? ` to "${log.newValue}"` : "";
        return `updated ${log.field}${from}${to} on${log.task ? ` "${log.task.title}"` : " a task"}`;
      }
      return `updated${log.task ? ` "${log.task.title}"` : " a task"}`;
    case "MOVED":
      return `moved${log.task ? ` "${log.task.title}"` : " a task"}${
        log.oldValue && log.newValue
          ? ` from "${log.oldValue}" to "${log.newValue}"`
          : ""
      }`;
    case "DELETED":
      return `deleted${log.task ? ` "${log.task.title}"` : " a task"}`;
    default:
      return `performed an action on${log.task ? ` "${log.task.title}"` : " a task"}`;
  }
}

function UserAvatar({ name }: { name: string }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  // Deterministic soft color based on first char code
  const hues = [0, 30, 60, 120, 180, 210, 240, 270, 300, 330];
  const hue = hues[initial.charCodeAt(0) % hues.length];
  return (
    <div
      className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-semibold shrink-0"
      style={{ backgroundColor: `hsl(${hue}, 60%, 50%)` }}
      aria-label={name}
    >
      {initial}
    </div>
  );
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="rounded-lg border border-border bg-card flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            No recent activity
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {activities.map((log, index) => (
              <li key={log.id} className="flex items-start gap-3 px-4 py-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <UserAvatar name={log.user.name} />
                  {index < activities.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-1 min-h-[12px]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm text-foreground leading-snug">
                    <span className="font-medium">{log.user.name}</span>{" "}
                    <span className="text-muted-foreground">{getActionText(log)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(log.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
