"use client";

import { CheckSquare, Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsRowProps {
  myTasksCount: number;
  dueTodayCount: number;
  overdueCount: number;
  breachedCount: number;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  borderClass,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border p-4 bg-card",
        borderClass
      )}
    >
      <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", bgClass)}>
        <Icon className={cn("w-5 h-5", colorClass)} />
      </div>
      <div>
        <p className={cn("text-2xl font-bold tabular-nums leading-none", colorClass)}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

export function StatsRow({
  myTasksCount,
  dueTodayCount,
  overdueCount,
  breachedCount,
}: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCard
        label="My Tasks"
        value={myTasksCount}
        icon={CheckSquare}
        colorClass="text-blue-600"
        bgClass="bg-blue-50"
        borderClass="border-blue-200"
      />
      <StatCard
        label="Due Today"
        value={dueTodayCount}
        icon={Clock}
        colorClass="text-orange-600"
        bgClass="bg-orange-50"
        borderClass="border-orange-200"
      />
      <StatCard
        label="Overdue"
        value={overdueCount}
        icon={AlertTriangle}
        colorClass="text-red-600"
        bgClass="bg-red-50"
        borderClass="border-red-200"
      />
      <StatCard
        label="SLA Breached"
        value={breachedCount}
        icon={AlertCircle}
        colorClass="text-destructive"
        bgClass="bg-destructive/10"
        borderClass="border-destructive/30"
      />
    </div>
  );
}
