import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Priority } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** SLA hours by priority (used when no board-level policy is set) */
export const DEFAULT_SLA_HOURS: Record<Priority, number> = {
  CRITICAL: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168,
};

export function getSLADeadline(
  priority: Priority,
  policy?: {
    criticalHours: number;
    highHours: number;
    mediumHours: number;
    lowHours: number;
  } | null
): Date {
  const hours = policy
    ? {
        CRITICAL: policy.criticalHours,
        HIGH: policy.highHours,
        MEDIUM: policy.mediumHours,
        LOW: policy.lowHours,
      }[priority]
    : DEFAULT_SLA_HOURS[priority];

  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function priorityColor(priority: Priority): string {
  return {
    CRITICAL: "text-red-600 bg-red-50 border-red-200",
    HIGH: "text-orange-600 bg-orange-50 border-orange-200",
    MEDIUM: "text-yellow-600 bg-yellow-50 border-yellow-200",
    LOW: "text-green-600 bg-green-50 border-green-200",
  }[priority];
}

export function slaStatusColor(status: string): string {
  return {
    OK: "text-green-600",
    AT_RISK: "text-yellow-600",
    BREACHED: "text-red-600",
  }[status] ?? "text-gray-400";
}

export function parseMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z0-9._-]+)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
}
