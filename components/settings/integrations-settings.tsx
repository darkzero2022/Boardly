"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, ChevronDown, ChevronUp, Zap } from "lucide-react";

interface Board {
  id: string;
  name: string;
  teamsWebhook: string | null;
  teamsChannelId: string | null;
  plannerPlanId: string | null;
  workspace: { name: string };
}

export function IntegrationsSettings({ boards }: { boards: Board[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, Partial<Board>>>(
    Object.fromEntries(boards.map((b) => [b.id, b]))
  );
  const [saving, setSaving] = useState<string | null>(null);

  function update(boardId: string, field: string, value: string) {
    setConfigs((prev) => ({
      ...prev,
      [boardId]: { ...prev[boardId], [field]: value },
    }));
  }

  async function save(boardId: string) {
    setSaving(boardId);
    await fetch(`/api/boards/${boardId}/integrations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(configs[boardId]),
    });
    setSaving(null);
  }

  return (
    <div className="space-y-3 max-w-3xl">
      {boards.map((board) => {
        const cfg = configs[board.id];
        const isOpen = expanded === board.id;
        const isConfigured = !!(cfg.teamsWebhook || cfg.plannerPlanId);

        return (
          <div key={board.id} className="border border-border rounded-xl bg-card overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
              onClick={() => setExpanded(isOpen ? null : board.id)}
            >
              <div className="text-left">
                <p className="font-medium">{board.name}</p>
                <p className="text-xs text-muted-foreground">{board.workspace.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {isConfigured ? (
                  <span className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Zap className="w-3 h-3" />
                    Configured
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Not configured</span>
                )}
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
                {/* Teams */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#5059C9">
                      <path d="M20 3H4a1 1 0 00-1 1v16a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1z" />
                    </svg>
                    Microsoft Teams
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Incoming Webhook URL
                      </label>
                      <Input
                        placeholder="https://xxx.webhook.office.com/..."
                        value={cfg.teamsWebhook ?? ""}
                        onChange={(e) => update(board.id, "teamsWebhook", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Channel ID (for tab embed)
                      </label>
                      <Input
                        placeholder="19:abc123..."
                        value={cfg.teamsChannelId ?? ""}
                        onChange={(e) => update(board.id, "teamsChannelId", e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tab embed URL:{" "}
                      <code className="bg-muted px-1 rounded text-[11px]">
                        {`${process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"}/embed/board/${board.id}`}
                      </code>
                    </p>
                  </div>
                </div>

                {/* Planner */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#31752F">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    Microsoft Planner
                  </h3>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Planner Plan ID
                    </label>
                    <Input
                      placeholder="Plan ID from MS Graph API"
                      value={cfg.plannerPlanId ?? ""}
                      onChange={(e) => update(board.id, "plannerPlanId", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tasks will be two-way synced with this Planner plan.
                      Requires Graph API credentials in .env.local.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => save(board.id)}
                  disabled={saving === board.id}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {saving === board.id ? "Saving..." : "Save Integrations"}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
