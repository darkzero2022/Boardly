"use client";

import { signOut } from "next-auth/react";
import { LogOut, User, ChevronDown, Search, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { NotificationBell } from "./notification-bell";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

interface SearchResult {
  tasks: { id: string; title: string; priority: string; boardId: string }[];
  comments: { id: string; body: string; taskId: string; task: { title: string; boardId?: string } }[];
  boards: { id: string; name: string }[];
}

const priorityColor: Record<string, string> = {
  CRITICAL: "text-red-500", HIGH: "text-orange-500", MEDIUM: "text-blue-500", LOW: "text-gray-400",
};

export function Header({ user }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const router = useRouter();

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) { setResults(await res.json()); setActiveIdx(0); }
    } finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 280);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setQuery("");
        setResults(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Build flat navigation list for arrow-key navigation
  const items: { label: string; sub?: string; href: string; color?: string }[] = [];
  if (results) {
    results.tasks.forEach(t => items.push({
      label: t.title,
      sub: t.priority,
      href: `/boards/${t.boardId}?task=${t.id}`,
      color: priorityColor[t.priority],
    }));
    results.boards.forEach(b => items.push({ label: b.name, sub: "Board", href: `/boards/${b.id}` }));
    results.comments.forEach(c => items.push({
      label: c.task?.title ?? "Unknown task",
      sub: c.body.slice(0, 60),
      href: `/boards/${(c.task as Record<string, unknown>)?.boardId ?? ""}?task=${c.taskId}`,
    }));
  }

  function navigate(href: string) {
    router.push(href);
    setPaletteOpen(false);
    setQuery("");
    setResults(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, items.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && items[activeIdx]) { navigate(items[activeIdx].href); }
  }

  const hasResults = results && (results.tasks.length > 0 || results.comments.length > 0 || results.boards.length > 0);

  return (
    <>
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background">
        {/* Search trigger */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-sm text-muted-foreground transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search…</span>
          <kbd className="ml-6 hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            title="Toggle dark mode"
          >
            {theme === "dark"
              ? <Sun className="w-4 h-4 text-muted-foreground" />
              : <Moon className="w-4 h-4 text-muted-foreground" />}
          </button>

          <NotificationBell userId={user.id ?? ""} />

          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name ?? "User"} className="w-8 h-8 rounded-full" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="text-sm">
              <p className="font-medium leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Command Palette Modal */}
      {paletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
          onClick={() => { setPaletteOpen(false); setQuery(""); setResults(null); }}
        >
          <div
            className="w-full max-w-xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search tasks, boards, comments…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">Esc</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {searching && (
                <p className="px-4 py-3 text-sm text-muted-foreground">Searching…</p>
              )}

              {!searching && query.length >= 2 && !hasResults && (
                <p className="px-4 py-3 text-sm text-muted-foreground">No results for "{query}"</p>
              )}

              {!searching && query.length < 2 && (
                <p className="px-4 py-3 text-sm text-muted-foreground">Start typing to search…</p>
              )}

              {!searching && hasResults && (() => {
                let flatIdx = 0;
                return (
                  <>
                    {results!.tasks.length > 0 && (
                      <div>
                        <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tasks</p>
                        {results!.tasks.map(t => {
                          const idx = flatIdx++;
                          return (
                            <button
                              key={t.id}
                              onClick={() => navigate(`/boards/${t.boardId}?task=${t.id}`)}
                              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${idx === activeIdx ? "bg-accent" : "hover:bg-accent/50"}`}
                            >
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.priority === "CRITICAL" ? "bg-red-500" : t.priority === "HIGH" ? "bg-orange-500" : t.priority === "MEDIUM" ? "bg-blue-500" : "bg-gray-400"}`} />
                              <span className="flex-1 truncate">{t.title}</span>
                              <span className={`text-xs flex-shrink-0 ${priorityColor[t.priority]}`}>{t.priority}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {results!.boards.length > 0 && (
                      <div>
                        <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Boards</p>
                        {results!.boards.map(b => {
                          const idx = flatIdx++;
                          return (
                            <button
                              key={b.id}
                              onClick={() => navigate(`/boards/${b.id}`)}
                              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${idx === activeIdx ? "bg-accent" : "hover:bg-accent/50"}`}
                            >
                              <span className="text-base flex-shrink-0">📋</span>
                              <span className="flex-1 truncate">{b.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {results!.comments.length > 0 && (
                      <div>
                        <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Comments</p>
                        {results!.comments.map(c => {
                          const idx = flatIdx++;
                          const boardId = (c.task as Record<string, unknown>)?.boardId as string ?? "";
                          return (
                            <button
                              key={c.id}
                              onClick={() => navigate(`/boards/${boardId}?task=${c.taskId}`)}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${idx === activeIdx ? "bg-accent" : "hover:bg-accent/50"}`}
                            >
                              <p className="font-medium truncate">{c.task?.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{c.body.slice(0, 80)}</p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[11px] text-muted-foreground">
              <span><kbd className="border border-border rounded px-1">↑↓</kbd> navigate</span>
              <span><kbd className="border border-border rounded px-1">↵</kbd> open</span>
              <span><kbd className="border border-border rounded px-1">Esc</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
