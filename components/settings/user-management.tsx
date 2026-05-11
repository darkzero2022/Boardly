"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, KeyRound, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  role: string;
  teamId: string | null;
  team: { id: string; name: string } | null;
  createdAt: Date;
  lastLoginAt?: Date | null;
}

interface Team {
  id: string;
  name: string;
}

function roleBadgeClass(role: string) {
  if (role === "ADMIN") return "bg-red-100 text-red-700";
  if (role === "MANAGER") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

export function UserManagement({
  initialUsers,
  teams,
  currentUserId,
}: {
  initialUsers: UserRecord[];
  teams: Team[];
  currentUserId: string;
}) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "MEMBER", teamId: "" });
  const [createLoading, setCreateLoading] = useState(false);

  // Password reset dialog
  const [resetTarget, setResetTarget] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setCreateLoading(false);
    if (res.ok) {
      const user = await res.json();
      setUsers((prev) => [...prev, { ...user, createdAt: new Date(), lastLoginAt: null, team: teams.find((t) => t.id === user.teamId) ?? null }]);
      setShowCreate(false);
      setForm({ name: "", email: "", password: "", role: "MEMBER", teamId: "" });
      toast({ title: "User created", description: `${user.name} has been added.` });
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ variant: "destructive", title: "Failed to create user", description: data.error?.formErrors?.[0] ?? "Please try again." });
    }
  }

  async function updateRole(userId: string, role: string) {
    const prev = users.find((u) => u.id === userId)?.role;
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      setUsers((p) => p.map((u) => u.id === userId ? { ...u, role: prev ?? u.role } : u));
      const data = await res.json().catch(() => ({}));
      toast({ variant: "destructive", title: "Failed to update role", description: data.error ?? "Please try again." });
    }
  }

  async function updateTeam(userId: string, teamId: string) {
    const value = teamId === "__none__" ? null : teamId;
    const prevUser = users.find((u) => u.id === userId);
    const team = teams.find((t) => t.id === value) ?? null;
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, teamId: value, team } : u));
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: value }),
    });
    if (!res.ok) {
      setUsers((p) => p.map((u) => u.id === userId ? { ...u, teamId: prevUser?.teamId ?? null, team: prevUser?.team ?? null } : u));
      const data = await res.json().catch(() => ({}));
      toast({ variant: "destructive", title: "Failed to update team", description: data.error ?? "Please try again." });
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setResetLoading(true);
    const res = await fetch(`/api/users/${resetTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    setResetLoading(false);
    if (res.ok) {
      setResetTarget(null);
      setNewPassword("");
      toast({ title: "Password updated", description: `${resetTarget.name ?? resetTarget.email}'s password has been reset.` });
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ variant: "destructive", title: "Failed to reset password", description: data.error ?? "Please try again." });
    }
  }

  async function deleteUser() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteLoading(false);
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast({ title: "User deleted", description: `${deleteTarget.name ?? deleteTarget.email} has been removed.` });
      setDeleteTarget(null);
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ variant: "destructive", title: "Failed to delete user", description: data.error ?? "Please try again." });
    }
  }

  function openResetPassword(user: UserRecord) {
    setNewPassword(crypto.randomUUID().slice(0, 12));
    setResetTarget(user);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add User
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Team</th>
              <th className="text-left px-4 py-3 font-medium">Joined</th>
              <th className="text-left px-4 py-3 font-medium">Last Login</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {(u.name ?? u.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {u.id === currentUserId ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleBadgeClass(u.role)}`}>
                      {u.role}
                    </span>
                  ) : (
                    <Select value={u.role} onValueChange={(v) => updateRole(u.id, v)}>
                      <SelectTrigger className="h-7 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={u.teamId ?? "__none__"}
                    onValueChange={(v) => updateTeam(u.id, v)}
                  >
                    <SelectTrigger className="h-7 text-xs w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No team</SelectItem>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {formatDate(u.createdAt)}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}
                </td>
                <td className="px-4 py-3">
                  {u.id !== currentUserId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openResetPassword(u)}>
                          <KeyRound className="w-4 h-4 mr-2" />
                          Reset password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(u)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create user dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={createUser} className="space-y-3">
            <Input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              type="password"
              placeholder="Password (min 6 chars)"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
            />
            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.teamId} onValueChange={(v) => setForm((f) => ({ ...f, teamId: v }))}>
              <SelectTrigger><SelectValue placeholder="Assign to team (optional)" /></SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={createLoading}>{createLoading ? "Creating..." : "Create User"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(open) => { if (!open) setResetTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password — {resetTarget?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={resetPassword} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter a new password for this user. They will need to use it on their next login.
            </p>
            <Input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="New password"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetTarget(null)}>Cancel</Button>
              <Button type="submit" disabled={resetLoading}>{resetLoading ? "Saving..." : "Set Password"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name ?? deleteTarget?.email}</strong>?
            This action cannot be undone. Their tasks and comments will remain but will be unassigned.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteLoading}
              onClick={deleteUser}
            >
              {deleteLoading ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
