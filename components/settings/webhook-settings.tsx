"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Zap, Globe, CheckCircle, XCircle } from "lucide-react";

const ALL_EVENTS = [
  { value: "task.created", label: "Task Created" },
  { value: "task.moved", label: "Task Moved" },
  { value: "task.updated", label: "Task Updated" },
  { value: "task.completed", label: "Task Completed" },
  { value: "comment.added", label: "Comment Added" },
];

interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  events: string;
  active: boolean;
  board: { id: string; name: string } | null;
}

interface WebhookSettingsProps {
  initial: Webhook[];
}

export function WebhookSettings({ initial }: WebhookSettingsProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<string, "ok" | "fail" | null>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    url: "",
    secret: "",
    events: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  function toggleEvent(evt: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(evt) ? f.events.filter((e) => e !== evt) : [...f.events, evt],
    }));
  }

  async function handleCreate() {
    if (!form.name || !form.url || form.events.length === 0) return;
    setSaving(true);
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, url: form.url, secret: form.secret || undefined, events: form.events }),
    });
    if (res.ok) {
      const wh = await res.json();
      setWebhooks((prev) => [wh, ...prev]);
      setForm({ name: "", url: "", secret: "", events: [] });
      setDialogOpen(false);
    }
    setSaving(false);
  }

  async function handleToggle(wh: Webhook) {
    const res = await fetch(`/api/webhooks/${wh.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !wh.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setWebhooks((prev) => prev.map((w) => (w.id === wh.id ? updated : w)));
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    setDeleting(null);
  }

  async function handleTest(id: string) {
    setTestStatus((s) => ({ ...s, [id]: null }));
    const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
    const data = await res.json();
    setTestStatus((s) => ({ ...s, [id]: data.ok ? "ok" : "fail" }));
    setTimeout(() => setTestStatus((s) => ({ ...s, [id]: null })), 4000);
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Outbound Webhooks</h2>
          <p className="text-sm text-muted-foreground">Send HTTP POST events to external services when things happen in Boardly.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Webhook
        </Button>
      </div>

      {webhooks.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
          No webhooks configured yet. Add one to start sending events.
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((wh) => {
            const events: string[] = JSON.parse(wh.events);
            const status = testStatus[wh.id];
            return (
              <div key={wh.id} className="border border-border rounded-xl bg-card px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-sm">{wh.name}</span>
                      {wh.active ? (
                        <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-full font-medium">Active</span>
                      ) : (
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{wh.url}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {events.map((e) => (
                        <span key={e} className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{e}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {status === "ok" && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {status === "fail" && <XCircle className="w-4 h-4 text-destructive" />}
                    <Button variant="outline" size="sm" onClick={() => handleTest(wh.id)}>
                      <Zap className="w-3.5 h-3.5 mr-1" /> Test
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggle(wh)}>
                      {wh.active ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(wh.id)}
                      disabled={deleting === wh.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
              <Input placeholder="My Webhook" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">URL</label>
              <Input placeholder="https://example.com/hook" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Secret (optional — used for HMAC signature)</label>
              <Input placeholder="mysecret" value={form.secret} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Events</label>
              <div className="space-y-1.5">
                {ALL_EVENTS.map((evt) => (
                  <label key={evt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.events.includes(evt.value)}
                      onChange={() => toggleEvent(evt.value)}
                      className="rounded"
                    />
                    <span className="text-sm">{evt.label}</span>
                    <code className="text-[10px] text-muted-foreground">{evt.value}</code>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name || !form.url || form.events.length === 0}>
              {saving ? "Creating..." : "Create Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
