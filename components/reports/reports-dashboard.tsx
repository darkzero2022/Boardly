"use client";

import { useState, useEffect } from "react";
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

export function ReportsDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("workload");
  const [workload, setWorkload] = useState<WorkloadUser[]>([]);
  const [slaData, setSlaData] = useState<SLASummary | null>(null);
  const [burndown, setBurndown] = useState<{ date: string; created: number; completed: number }[]>([]);

  useEffect(() => {
    fetch("/api/reports/workload")
      .then((r) => r.json())
      .then(setWorkload);
    fetch("/api/reports/sla?days=30")
      .then((r) => r.json())
      .then(setSlaData);
    fetch("/api/reports/burndown?days=14")
      .then((r) => r.json())
      .then(setBurndown);
  }, []);

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

      {activeTab === "workload" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Tasks per Team Member</h3>
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
                {workload.map((u) => (
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

      {activeTab === "sla" && slaData && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Tasks", value: slaData.summary.total, color: "text-foreground" },
              { label: "On Track", value: slaData.summary.ok, color: "text-green-600" },
              { label: "At Risk", value: slaData.summary.atRisk, color: "text-yellow-600" },
              { label: "Compliance Rate", value: `${slaData.summary.compliancePct}%`, color: "text-primary" },
            ].map((card) => (
              <div key={card.label} className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">SLA Compliance Over 30 Days</h3>
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
          </div>
        </div>
      )}

      {activeTab === "burndown" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Task Burndown (14 days)</h3>
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
        </div>
      )}
    </div>
  );
}
