"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Kanban,
  BarChart2,
  Settings,
  Users,
  Tag,
  Bell,
  Building2,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workspaces", label: "Workspaces", icon: Building2 },
  { href: "/reports", label: "Reports", icon: BarChart2 },
];

const settingsItems = [
  { href: "/settings/users", label: "Users", icon: Users },
  { href: "/settings/teams", label: "Teams", icon: Building2 },
  { href: "/settings/labels", label: "Labels", icon: Tag },
  { href: "/settings/sla", label: "SLA Policies", icon: Bell },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/integrations", label: "Integrations", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Kanban className="w-4 h-4 text-white" />
          </div>
          <span className="text-sidebar-foreground font-semibold text-sm">Boardly</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-xs text-sidebar-foreground/40 font-medium px-2 pt-2 pb-1 uppercase tracking-wider">
          Main
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        <p className="text-xs text-sidebar-foreground/40 font-medium px-2 pt-4 pb-1 uppercase tracking-wider">
          Settings
        </p>
        {settingsItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
