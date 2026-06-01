"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Bell, Mail, Monitor, MessageSquare, Send } from "lucide-react";

interface NotifConfig {
  inApp: boolean;
  email: boolean;
  teams: boolean;
  browser: boolean;
  onAssigned: boolean;
  onMention: boolean;
  onSlaWarning: boolean;
  onSlaBreach: boolean;
  onCompleted: boolean;
}

interface GlobalConfig {
  allowInApp: boolean;
  allowEmail: boolean;
  allowTeams: boolean;
  allowBrowser: boolean;
  allowMicrosoftSSO: boolean;
  allowCredentials: boolean;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
}

function Toggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={`flex items-center justify-between py-3 ${disabled ? "opacity-50" : ""}`}>
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationSettings({
  userId,
  isAdmin,
  userConfig,
  globalConfig,
}: {
  userId: string;
  isAdmin: boolean;
  userConfig: Partial<NotifConfig> | null;
  globalConfig: Partial<GlobalConfig> | null;
}) {
  const [user, setUser] = useState<NotifConfig>({
    inApp: userConfig?.inApp ?? true,
    email: userConfig?.email ?? false,
    teams: userConfig?.teams ?? false,
    browser: userConfig?.browser ?? false,
    onAssigned: userConfig?.onAssigned ?? true,
    onMention: userConfig?.onMention ?? true,
    onSlaWarning: userConfig?.onSlaWarning ?? true,
    onSlaBreach: userConfig?.onSlaBreach ?? true,
    onCompleted: userConfig?.onCompleted ?? false,
  });

  const [global, setGlobal] = useState<GlobalConfig>({
    allowInApp: globalConfig?.allowInApp ?? true,
    allowEmail: globalConfig?.allowEmail ?? true,
    allowTeams: globalConfig?.allowTeams ?? false,
    allowBrowser: globalConfig?.allowBrowser ?? false,
    allowMicrosoftSSO: globalConfig?.allowMicrosoftSSO ?? true,
    allowCredentials: globalConfig?.allowCredentials ?? true,
    smtpHost: (globalConfig as Record<string, unknown>)?.smtpHost as string ?? "",
    smtpPort: (globalConfig as Record<string, unknown>)?.smtpPort as number ?? 587,
    smtpUser: (globalConfig as Record<string, unknown>)?.smtpUser as string ?? "",
    smtpPass: "",
  });

  const [saving, setSaving] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);

  async function saveUserConfig() {
    setSaving(true);
    await fetch("/api/notifications/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    setSaving(false);
  }

  async function saveGlobalConfig() {
    setSavingGlobal(true);
    const payload = { ...global, smtpPort: Number(global.smtpPort) || 587 };
    if (!payload.smtpPass) delete (payload as Record<string, unknown>).smtpPass;
    await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSavingGlobal(false);
  }

  async function sendTestEmail() {
    setTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch("/api/admin/config/test-email", { method: "POST" });
      const data = await res.json();
      setTestEmailResult(res.ok ? `Test email sent to ${data.sentTo}` : data.error ?? "Failed");
    } catch {
      setTestEmailResult("Request failed");
    }
    setTestingEmail(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Personal preferences */}
      <div className="border border-border rounded-xl bg-card p-5">
        <h2 className="font-semibold mb-1">My Notification Channels</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Choose how you want to be notified. Admin controls which channels are available.
        </p>
        <div className="divide-y divide-border">
          <Toggle
            label="In-app notifications"
            description="Bell icon inside Boardly"
            checked={user.inApp}
            disabled={!global.allowInApp}
            onChange={(v) => setUser((u) => ({ ...u, inApp: v }))}
          />
          <Toggle
            label="Email notifications"
            description="Receive emails for important events"
            checked={user.email}
            disabled={!global.allowEmail}
            onChange={(v) => setUser((u) => ({ ...u, email: v }))}
          />
          <Toggle
            label="Microsoft Teams alerts"
            description="Notifications in your Teams channel"
            checked={user.teams}
            disabled={!global.allowTeams}
            onChange={(v) => setUser((u) => ({ ...u, teams: v }))}
          />
          <Toggle
            label="Browser push notifications"
            description="Desktop alerts when tab is not active"
            checked={user.browser}
            disabled={!global.allowBrowser}
            onChange={(v) => setUser((u) => ({ ...u, browser: v }))}
          />
        </div>

        <h2 className="font-semibold mt-5 mb-1">Notify me when...</h2>
        <div className="divide-y divide-border">
          <Toggle
            label="Assigned to a task"
            checked={user.onAssigned}
            onChange={(v) => setUser((u) => ({ ...u, onAssigned: v }))}
          />
          <Toggle
            label="Mentioned in a comment"
            checked={user.onMention}
            onChange={(v) => setUser((u) => ({ ...u, onMention: v }))}
          />
          <Toggle
            label="SLA at risk"
            description="Task approaching its SLA deadline"
            checked={user.onSlaWarning}
            onChange={(v) => setUser((u) => ({ ...u, onSlaWarning: v }))}
          />
          <Toggle
            label="SLA breached"
            checked={user.onSlaBreach}
            onChange={(v) => setUser((u) => ({ ...u, onSlaBreach: v }))}
          />
          <Toggle
            label="Task completed"
            checked={user.onCompleted}
            onChange={(v) => setUser((u) => ({ ...u, onCompleted: v }))}
          />
        </div>

        <Button className="mt-4" size="sm" onClick={saveUserConfig} disabled={saving}>
          <Save className="w-3.5 h-3.5 mr-1.5" />
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>

      {/* Admin global config */}
      {isAdmin && (
        <div className="border border-border rounded-xl bg-card p-5">
          <h2 className="font-semibold mb-1">Global Channel Config (Admin)</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Control which notification channels are available to all users.
          </p>
          <div className="divide-y divide-border">
            <Toggle
              label="Allow in-app notifications"
              checked={global.allowInApp}
              onChange={(v) => setGlobal((g) => ({ ...g, allowInApp: v }))}
            />
            <Toggle
              label="Allow email notifications"
              description="Requires SMTP configured in settings"
              checked={global.allowEmail}
              onChange={(v) => setGlobal((g) => ({ ...g, allowEmail: v }))}
            />
            <Toggle
              label="Allow Microsoft Teams alerts"
              description="Requires Teams webhook URL per board"
              checked={global.allowTeams}
              onChange={(v) => setGlobal((g) => ({ ...g, allowTeams: v }))}
            />
            <Toggle
              label="Allow browser push"
              description="Requires VAPID keys configured"
              checked={global.allowBrowser}
              onChange={(v) => setGlobal((g) => ({ ...g, allowBrowser: v }))}
            />
          </div>

          {/* SMTP Config */}
          <h2 className="font-semibold mt-5 mb-3">SMTP Configuration</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Host</label>
              <Input placeholder="smtp.example.com" value={global.smtpHost ?? ""} onChange={(e) => setGlobal((g) => ({ ...g, smtpHost: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Port</label>
              <Input type="number" placeholder="587" value={global.smtpPort ?? 587} onChange={(e) => setGlobal((g) => ({ ...g, smtpPort: parseInt(e.target.value) || 587 }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Username</label>
              <Input placeholder="user@example.com" value={global.smtpUser ?? ""} onChange={(e) => setGlobal((g) => ({ ...g, smtpUser: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Password</label>
              <Input type="password" placeholder="Leave blank to keep current" value={global.smtpPass ?? ""} onChange={(e) => setGlobal((g) => ({ ...g, smtpPass: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Button size="sm" variant="outline" onClick={sendTestEmail} disabled={testingEmail || !global.smtpHost}>
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {testingEmail ? "Sending..." : "Send Test Email"}
            </Button>
            {testEmailResult && <span className="text-xs text-muted-foreground">{testEmailResult}</span>}
          </div>

          <h2 className="font-semibold mt-5 mb-1">Authentication Providers</h2>
          <div className="divide-y divide-border">
            <Toggle
              label="Microsoft SSO (Azure AD)"
              description="Sign in with Microsoft 365 accounts"
              checked={global.allowMicrosoftSSO}
              onChange={(v) => setGlobal((g) => ({ ...g, allowMicrosoftSSO: v }))}
            />
            <Toggle
              label="Username & Password"
              description="Local credential-based login"
              checked={global.allowCredentials}
              onChange={(v) => setGlobal((g) => ({ ...g, allowCredentials: v }))}
            />
          </div>

          <Button className="mt-4" size="sm" onClick={saveGlobalConfig} disabled={savingGlobal}>
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {savingGlobal ? "Saving..." : "Save Global Config"}
          </Button>
        </div>
      )}
    </div>
  );
}
