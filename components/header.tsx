"use client";

import { signOut } from "next-auth/react";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import { NotificationBell } from "./notification-bell";

interface HeaderProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {/* Breadcrumb injected by child pages via context */}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell userId={user.id ?? ""} />

        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? "User"}
                className="w-8 h-8 rounded-full"
              />
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
