"use client";

import { signOut } from "next-auth/react";
import { LogOut, User, ChevronDown, Search, Sun, Moon, X } from "lucide-react";
import { useTheme } from "next-themes";
import { NotificationBell } from "./notification-bell";
import { useState, useEffect, useRef, useCallback } from "react";
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
  comments: { id: string; body: string; taskId: string; task: { title: string } }[];
  boards: { id: string; name: string }[];
}

export function Header({ user }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const priorityColor: Record<string, string> = {
    CRITICAL: "text-red-500", HIGH: "text-orange-500", MEDIUM: "text-blue-500", LOW: "text-gray-400",
  };

  const hasResults = results && (results.tasks.length > 0 || results.comments.length > 0 || results.boards.length > 0);

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background">
      {/* Search */}
      <div className="flex items-center gap-2 relative" ref={searchRef}>
        {searchOpen ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tasks, comments, boards…"
              className="w-72 px-3 py-1.5 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button onClick={() => { setSearchOpen(false); setQuery(""); setResults(null); }} className="p-1 hover:bg-accent rounded">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <button onClick={() => setSearchOpen(true)} className="p-2 rounded-md hover:bg-accent transition-colors" title="Search">
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Results dropdown */}
        {searchOpen && query.length >= 2 && (
          <div className="absolute top-10 left-0 w-96 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            {searching && <p className="p-3 text-sm text-muted-foreground">Searching…</p>}
            {!searching && !hasResults && <p className="p-3 text-sm text-muted-foreground">No results for "{query}"</p>}
            {!searching && hasResults && (
              <div className="max-h-80 overflow-y-auto py-1">
                {results!.tasks.length > 0 && (
                  <>
                    <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tasks</p>
                    {results!.tasks.map(t => (
                      <button key={t.id} onClick={() => { router.push(`/boards/${t.boardId}?task=${t.id}`); setSearchOpen(false); setQuery(""); }}
                        className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${t.priority === "CRITICAL" ? "bg-red-500" : t.priority === "HIGH" ? "bg-orange-500" : t.priority === "MEDIUM" ? "bg-blue-500" : "bg-gray-400"}`} />
                        <span className="truncate">{t.title}</span>
                        <span className={`ml-auto text-xs ${priorityColor[t.priority]}`}>{t.priority}</span>
                      </button>
                    ))}
                  </>
                )}
                {results!.boards.length > 0 && (
                  <>
                    <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Boards</p>
                    {results!.boards.map(b => (
                      <button key={b.id} onClick={() => { router.push(`/boards/${b.id}`); setSearchOpen(false); setQuery(""); }}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm truncate">
                        📋 {b.name}
                      </button>
                    ))}
                  </>
                )}
                {results!.comments.length > 0 && (
                  <>
                    <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comments</p>
                    {results!.comments.map(c => (
                      <button key={c.id} onClick={() => { router.push(`/boards/${c.task ? (c as any).taskBoardId : ""}?task=${c.taskId}`); setSearchOpen(false); setQuery(""); }}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm">
                        <span className="text-muted-foreground">in </span>
                        <span className="font-medium">{c.task?.title}</span>
                        <p className="text-xs text-muted-foreground truncate">{c.body.slice(0, 60)}</p>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-md hover:bg-accent transition-colors"
          title="Toggle dark mode"
        >
          {theme === "dark"
            ? <Sun className="w-4 h-4 text-muted-foreground" />
            : <Moon className="w-4 h-4 text-muted-foreground" />
          }
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
  );
}
