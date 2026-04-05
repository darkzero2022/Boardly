"use client";

import Link from "next/link";
import { ArrowLeft, Settings, LayoutGrid, Calendar, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardFilters } from "./board-filters";

interface BoardHeaderProps {
  board: {
    id: string;
    name: string;
    workspace: { id: string; name: string };
  };
  session: { user: { role?: string } };
  view: "kanban" | "calendar";
  onViewChange: (v: "kanban" | "calendar") => void;
  bulkMode: boolean;
  onBulkToggle: () => void;
}

export function BoardHeader({ board, session, view, onViewChange, bulkMode, onBulkToggle }: BoardHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
      <Link href={`/workspaces/${board.workspace.id}`}>
        <Button variant="ghost" size="icon">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/workspaces" className="hover:text-foreground">Workspaces</Link>
          <span>/</span>
          <Link href={`/workspaces/${board.workspace.id}`} className="hover:text-foreground">{board.workspace.name}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{board.name}</span>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
        <button
          onClick={() => onViewChange("kanban")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "kanban" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Kanban
        </button>
        <button
          onClick={() => onViewChange("calendar")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "calendar" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Calendar className="w-3.5 h-3.5" /> Calendar
        </button>
      </div>

      <Button
        variant={bulkMode ? "default" : "outline"}
        size="sm"
        onClick={onBulkToggle}
        className="gap-1.5"
      >
        <CheckSquare className="w-3.5 h-3.5" />
        {bulkMode ? "Exit Select" : "Select"}
      </Button>

      <BoardFilters boardId={board.id} />

      {(session.user.role === "ADMIN" || session.user.role === "MANAGER") && (
        <Link href={`/settings/boards/${board.id}`}>
          <Button variant="outline" size="sm">
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Settings
          </Button>
        </Link>
      )}
    </div>
  );
}
