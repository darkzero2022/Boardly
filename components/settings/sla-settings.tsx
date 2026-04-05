"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, ChevronDown, ChevronUp, Clock } from "lucide-react";

interface SLAEscalation {
  id: string;
  triggerPct: number;
  notifyRoles: string;
}

interface SLAPolicy {
  id: string;
  criticalHours: number;
  highHours: number;
  mediumHours: number;
  lowHours: number;
  escalations: SLAEscalation[];
}

interface Board {
  id: string;
  name: string;
  workspace: { name: string };
  slaPolicy: SLAPolicy | null;
}

export function SLASettings({ boards }: { boards: Board[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [policies, setPolicies] = useState<Record<string, SLAPolicy>>(
    Object.fromEntries(
      boards
        .filter((b) => b.slaPolicy)
        .map((b) => [b.id, b.slaPolicy!])
    )
  );
  const [saving, setSaving] = useState<string | null>(null);

  function updatePolicy(boardId: string, field: keyof SLAPolicy, value: number) {
    setPolicies((prev) => ({
      ...prev,
      [boardId]: { ...prev[boardId], [field]: value },
    }));
  }

  async function savePolicy(boardId: string) {
    const policy = policies[boardId];
    if (!policy) return;
    setSaving(boardId);
    await fetch(`/api/boards/${boardId}/sla`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(policy),
    });
    setSaving(null);
  }

  return (
    <div className="space-y-3">
      {boards.map((board) => {
        const policy = policies[board.id];
        const isOpen = expanded === board.id;

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
                {policy ? (
                  <span className="text-xs text-green-600 font-medium">SLA active</span>
                ) : (
                  <span className="text-xs text-muted-foreground">No SLA</span>
                )}
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {isOpen && policy && (
              <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(
                    [
                      { key: "criticalHours", label: "Critical", color: "text-red-600" },
                      { key: "highHours", label: "High", color: "text-orange-600" },
                      { key: "mediumHours", label: "Medium", color: "text-yellow-600" },
                      { key: "lowHours", label: "Low", color: "text-green-600" },
                    ] as const
                  ).map(({ key, label, color }) => (
                    <div key={key}>
                      <label className={`text-xs font-semibold ${color} mb-1 block`}>
                        {label}
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={1}
                          value={policy[key]}
                          onChange={(e) =>
                            updatePolicy(board.id, key, parseInt(e.target.value) || 1)
                          }
                          className="pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          hrs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Escalation rules */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Escalation triggers
                  </p>
                  <div className="space-y-2">
                    {policy.escalations.map((esc) => {
                      const roles: string[] = JSON.parse(esc.notifyRoles);
                      return (
                        <div
                          key={esc.id}
                          className="flex items-center gap-3 text-sm bg-muted rounded-lg px-3 py-2"
                        >
                          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>
                            At <strong>{esc.triggerPct}%</strong> elapsed → notify{" "}
                            <strong>{roles.join(", ")}</strong>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => savePolicy(board.id)}
                  disabled={saving === board.id}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {saving === board.id ? "Saving..." : "Save Policy"}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
