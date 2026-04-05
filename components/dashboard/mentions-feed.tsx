"use client";

import { AtSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  body: string;
  createdAt: string | Date;
  author: {
    name: string;
  };
  task: {
    id: string;
    title: string;
    boardId: string;
  };
}

interface MentionsFeedProps {
  mentions: Comment[];
  onTaskClick: (taskId: string) => void;
}

function UserAvatar({ name }: { name: string }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
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

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export function MentionsFeed({ mentions, onTaskClick }: MentionsFeedProps) {
  return (
    <div className="rounded-lg border border-border bg-card flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <AtSign className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Mentions</h2>
        {mentions.length > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold w-5 h-5 ml-auto">
            {mentions.length}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-y-auto">
        {mentions.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            No recent mentions
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {mentions.map((comment) => (
              <li key={comment.id}>
                <button
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent text-left transition-colors"
                  onClick={() => onTaskClick(comment.task.id)}
                >
                  <UserAvatar name={comment.author.name} />

                  <div className="flex-1 min-w-0">
                    {/* Author + time */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {comment.author.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {/* Comment excerpt */}
                    <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                      {truncate(comment.body, 80)}
                    </p>

                    {/* Task chip */}
                    <div className="mt-1.5">
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-accent text-muted-foreground border border-border max-w-full truncate">
                        {comment.task.title}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
