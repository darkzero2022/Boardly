"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download, Users, TrendingDown, Shield } from "lucide-react";

interface WorkloadUser {
  id: string;
  name: string | null;
  total: number;
  ok: number;
  atRisk: number;
  breached: number;
  critical: number;
}

interface SLASummary {
  chart: { date: string; ok: number; atRisk: number; breached: number; compliancePct: number }[];
  summary: { total: number; ok: number; atRisk: number; breached: number; compliancePct: number };
}

type ActiveTab = "workload" | "sla" | "burndown";

const DAY_PRESETS = [7, 14, 30, 90] as const;

function ChartSkeleton() {
  return <div className="h-[300px] bg-muted animate-pulse rounded-xl" />;
}

function MetricCard({ label, value, color = "text-foreground" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export function ReportsDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<ActiveTab>("workload");

  const [workload, setWorkload] = useState<WorkloadUser[]>([]);
  const [slaData, setSlaData] = useState<SLASummary | null>(null);
  const [burndown, setBurndown] = useState<{ date: string; created: number; completed: number }[]>([]);

  const [loading, setLoading] = useState({ workload: true, sla: true, burndown: true });

  const [slaDays, setSlaDays] = useState(30);
  const [burndownDays, setBurndownDays] = useState(14);
  const [soloMode, setSoloMode] = useState(false);
  const [appModeLoaded, setAppModeLoaded] = useState(false);

  const fetchWorkload = useCallback(async () => {
    setLoading((l) => ({ ...l, workload: true }));
    const userId = soloMode && session?.user?.id ? `?userId=${session.user.id}` : "";
    const data = await fetch(`/api/reports/workload${userId}`).then((r) => r.json());
    setWorkload(data);
    setLoading((l) => ({ ...l, workload: false }));
  }, [soloMode, session?.user?.id]);

  const fetchSla = useCallback(async () => {
    setLoading((l) => ({ ...l, sla: true }));
    const data = await fetch(`/api/reports/sla?days=${slaDays}`).then((r) => r.json());
    setSlaData(data);
    setLoading((l) => ({ ...l, sla: false }));
  }, [slaDays]);

  const fetchBurndown = useCallback(async () => {
    setLoading((l) => ({ ...l, burndown: true }));
    const data = await fetch(`/api/reports/burndown?days=${burndownDays}`).then((r) => r.json());
    setBurndown(data);
    setLoading((l) => ({ ...l, burndown: false }));
  }, [burndownDays]);

  // Load appMode from setup config to default solo toggle for solo installs
  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then(({ appMode }) => {
        if (appMode === "solo") setSoloMode(true);
        setAppModeLoaded(true);
      })
      .catch(() => setAppModeLoaded(true));
  }, []);

  useEffect(() => { if (appModeLoaded) fetchWorkload(); }, [fetchWorkload, appModeLoaded]);
  useEffect(() => { fetchSla(); }, [fetchSla]);
  useEffect(() => { fetchBurndown(); }, [fetchBurndown]);

  async function handleExport() {
    const res = await fetch("/api/reports/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kanboard-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const tabs = [
    { key: "workload" as const, label: "Team Workload", icon: Users },
    { key: "sla" as const, label: "SLA Compliance", icon: Shield },
    { key: "burndown" as const, label: "Burndown", icon: TrendingDown },
  ];

  // Derived metrics
  const workloadTotals = workload.reduce(
    (acc, u) => ({ total: acc.total + u.total, atRisk: acc.atRisk + u.atRisk, breached: acc.breached + u.breached }),
    { total: 0, atRisk: 0, breached: 0 }
  );
  const burndownTotals = burndown.reduce(
    (acc, d) => ({ created: acc.created + d.created, completed: acc.completed + d.completed }),
    { created: 0, completed: 0 }
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Export Excel
        </Button>
      </div>

      {/* ── Workload tab ─────────────────────────────────────────── */}
      {activeTab === "workload" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-3 gap-4 flex-1 mr-4">
              <MetricCard label="Total Assigned" value={workloadTotals.total} />
              <MetricCard label="At Risk" value={workloadTotals.atRisk} color="text-yellow-600" />
              <MetricCard label="Breached" value={workloadTotals.breached} color="text-red-600" />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none shrink-0">
              <div
                role="switch"
                aria-checked={soloMode}
                onClick={() => setSoloMode((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  soloMode ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${soloMode ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              My tasks only
            </label>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">
              {soloMode ? "My Task Distribution" : "Tasks per Team Member"}
            </h3>
            {loading.workload ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workload}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ok" name="On Track" fill="#22c55e" stackId="a" />
                  <Bar dataKey="atRisk" name="At Risk" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="breached" name="Breached" fill="#ef4444" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-center px-4 py-3 font-medium">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-green-600">On Track</th>
                  <th className="text-center px-4 py-3 font-medium text-yellow-600">At Risk</th>
                  <th className="text-center px-4 py-3 font-medium text-red-600">Breached</th>
                  <th className="text-center px-4 py-3 font-medium">Critical</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading.workload
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-muted animate-pulse rounded" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : workload.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-center">{u.total}</td>
                        <td className="px-4 py-3 text-center text-green-600">{u.ok}</td>
                        <td className="px-4 py-3 text-center text-yellow-600">{u.atRisk}</td>
                        <td className="px-4 py-3 text-center text-red-600">{u.breached}</td>
                        <td className="px-4 py-3 text-center">{u.critical}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SLA tab ──────────────────────────────────────────────── */}
      {activeTab === "sla" && (
        <div className="space-y-4">
          {slaData && !loading.sla ? (
            <div className="grid grid-cols-4 gap-4">
              <MetricCard label="Total Tasks" value={slaData.summary.total} />
              <MetricCard label="On Track" value={slaData.summary.ok} color="text-green-600" />
              <MetricCard label="At Risk" value={slaData.summary.atRisk} color="text-yellow-600" />
              <MetricCard label="Compliance Rate" value={`${slaData.summary.compliancePct}%`} color="text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 h-20 animate-pulse bg-muted" />
              ))}
            </div>
          )}

          {/* Day presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show:</span>
            {DAY_PRESETS.map((d) => (
              <button
                key={d}
                onClick={() => setSlaDays(d)}
                className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                  slaDays === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-foreground"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">SLA Compliance Over {slaDays} Days</h3>
            {loading.sla ? <ChartSkeleton /> : slaData && (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={slaData.chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="ok" name="On Track" fill="#22c55e" stackId="a" />
                  <Bar yAxisId="left" dataKey="atRisk" name="At Risk" fill="#f59e0b" stackId="a" />
                  <Bar yAxisId="left" dataKey="breached" name="Breached" fill="#ef4444" stackId="a" />
                  <Line yAxisId="right" type="monotone" dataKey="compliancePct" name="Compliance %" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Burndown tab ─────────────────────────────────────────── */}
      {activeTab === "burndown" && (
        <div className="space-y-4">
          {/* Metric cards */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard label={`Created (${burndownDays}d)`} value={burndownTotals.created} color="text-blue-600" />
            <MetricCard label={`Completed (${burndownDays}d)`} value={burndownTotals.completed} color="text-green-600" />
            <MetricCard
              label="Net (created − done)"
              value={burndownTotals.created - burndownTotals.completed}
              color={burndownTotals.created - burndownTotals.completed > 0 ? "text-red-600" : "text-green-600"}
            />
          </div>

          {/* Day presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show:</span>
            {DAY_PRESETS.map((d) => (
              <button
                key={d}
                onClick={() => setBurndownDays(d)}
                className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                  burndownDays === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-foreground"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Task Burndown ({burndownDays} days)</h3>
            {loading.burndown ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={burndown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="created" name="Created" stroke="#3b82f6" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="#22c55e" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
