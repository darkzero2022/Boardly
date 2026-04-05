"use client";

import { useRouter } from "next/navigation";
import { MyTasksCard } from "./my-tasks-card";

interface Task {
  id: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  slaStatus: "OK" | "AT_RISK" | "BREACHED" | null;
  dueDate: string | Date | null;
  board: { id: string; name: string };
  column: { name: string };
  labels: { label: { name: string; color: string } }[];
}

interface DashboardTaskNavProps {
  tasks: Task[];
}

export function DashboardTaskNav({ tasks }: DashboardTaskNavProps) {
  const router = useRouter();

  function handleTaskClick(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      router.push(`/boards/${task.board.id}?task=${taskId}`);
    }
  }

  return <MyTasksCard tasks={tasks} onTaskClick={handleTaskClick} />;
}
