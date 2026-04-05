"use client";

import Link from "next/link";
import { ArrowLeft, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardFilters } from "./board-filters";

interface BoardHeaderProps {
  board: {
    id: string;
    name: string;
    workspace: { id: string; name: string };
  };
  session: { user: { role?: string } };
}

export function BoardHeader({ board, session }: BoardHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
      <Link href={`/workspaces/${board.workspace.id}`}>
        <Button variant="ghost" size="icon">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/workspaces" className="hover:text-foreground">
            Workspaces
          </Link>
          <span>/</span>
          <Link
            href={`/workspaces/${board.workspace.id}`}
            className="hover:text-foreground"
          >
            {board.workspace.name}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{board.name}</span>
        </div>
      </div>

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
