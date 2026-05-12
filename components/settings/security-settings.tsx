"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, ShieldCheck, ShieldOff } from "lucide-react";

export function SecuritySettings({ totpEnabled: initialEnabled }: { totpEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<"idle" | "setup" | "disable">("idle");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSetup() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/totp/setup");
    const data = await res.json();
    setQrDataUrl(data.qrDataUrl);
    setSecret(data.secret);
    setStep("setup");
    setLoading(false);
  }

  async function confirmSetup() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/totp/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, token }),
    });
    setLoading(false);
    if (res.ok) {
      setEnabled(true);
      setStep("idle");
      setToken("");
    } else {
      const data = await res.json();
      setError(data.error ?? "Verification failed");
    }
  }

  async function confirmDisable() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/totp", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setLoading(false);
    if (res.ok) {
      setEnabled(false);
      setStep("idle");
      setToken("");
    } else {
      const data = await res.json();
      setError(data.error ?? "Verification failed");
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="border border-border rounded-xl bg-card p-6">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${enabled ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
            {enabled ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">Two-Factor Authentication</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {enabled
                ? "2FA is active. Your account requires a code from your authenticator app on each login."
                : "Add an extra layer of security using an authenticator app (Google Authenticator, Authy, etc.)."}
            </p>
            <div className="mt-3">
              {!enabled && step === "idle" && (
                <Button size="sm" onClick={startSetup} disabled={loading}>
                  {loading ? "Loading…" : "Enable 2FA"}
                </Button>
              )}
              {enabled && step === "idle" && (
                <Button size="sm" variant="outline" onClick={() => { setStep("disable"); setError(null); }}>
                  <ShieldOff className="w-3.5 h-3.5 mr-1.5" />
                  Disable 2FA
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Setup flow */}
        {step === "setup" && (
          <div className="mt-6 pt-6 border-t border-border space-y-4">
            <p className="text-sm font-medium">1. Scan this QR code with your authenticator app</p>
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="TOTP QR Code" className="w-40 h-40 border border-border rounded-lg" />
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Or enter this code manually:</p>
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">{secret}</code>
            </div>
            <p className="text-sm font-medium">2. Enter the 6-digit code from your app</p>
            <div className="flex gap-2">
              <Input
                placeholder="000000"
                value={token}
                onChange={e => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-36 font-mono text-center text-lg tracking-widest"
                maxLength={6}
              />
              <Button onClick={confirmSetup} disabled={loading || token.length !== 6}>
                {loading ? "Verifying…" : "Verify & Enable"}
              </Button>
              <Button variant="outline" onClick={() => { setStep("idle"); setToken(""); }}>Cancel</Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {/* Disable flow */}
        {step === "disable" && (
          <div className="mt-6 pt-6 border-t border-border space-y-4">
            <p className="text-sm">Enter your current authenticator code to confirm disabling 2FA:</p>
            <div className="flex gap-2">
              <Input
                placeholder="000000"
                value={token}
                onChange={e => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-36 font-mono text-center text-lg tracking-widest"
                maxLength={6}
              />
              <Button variant="destructive" onClick={confirmDisable} disabled={loading || token.length !== 6}>
                {loading ? "Verifying…" : "Disable 2FA"}
              </Button>
              <Button variant="outline" onClick={() => { setStep("idle"); setToken(""); }}>Cancel</Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
