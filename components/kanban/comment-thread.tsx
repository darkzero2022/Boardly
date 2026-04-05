"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { timeAgo } from "@/lib/utils";
import { Send } from "lucide-react";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
}

export function CommentThread({
  taskId,
  currentUserId,
}: {
  taskId: string;
  currentUserId: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/comments`)
      .then((r) => r.json())
      .then(setComments);
  }, [taskId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() }),
    });

    setLoading(false);
    if (res.ok) {
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setBody("");
    }
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Start the conversation!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {(c.author.name ?? "?")[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{c.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted rounded-lg p-3">
                  {c.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment... Use @name to mention"
          rows={2}
          className="flex-1 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              submit(e as never);
            }
          }}
        />
        <Button type="submit" size="icon" disabled={loading || !body.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
