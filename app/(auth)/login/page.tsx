"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type AuthMode = "credentials" | "ldap";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const error = params.get("error");
  const setupDone = params.get("setup") === "done";

  const [mode, setMode] = useState<AuthMode>("credentials");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const ldapEnabled = process.env.NEXT_PUBLIC_LDAP_ENABLED === "true";

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    // Check if this user has 2FA enabled before completing sign-in
    const totpCheck = await fetch("/api/auth/totp/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (totpCheck.ok) {
      const { requires2FA } = await totpCheck.json();
      if (requires2FA) {
        setLoading(false);
        const cb = params.get("callbackUrl") ?? "/";
        // Store password in sessionStorage (tab-scoped, never appears in URL/logs)
        sessionStorage.setItem("_2fa_pending_pass", password);
        router.push(`/login/totp?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(cb)}`);
        return;
      }
    }

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setAuthError("Invalid email or password.");
    } else {
      router.push("/");
    }
  }

  async function handleLdap(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    const res = await signIn("ldap", { username, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setAuthError("Directory authentication failed. Check your username and password.");
    } else {
      router.push("/");
    }
  }

  async function handleMicrosoft() {
    await signIn("microsoft-entra-id", { callbackUrl: "/" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Boardly</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your workspace</p>
        </div>

        {setupDone && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            ✓ Workspace created! Sign in with the admin account you just set up.
          </div>
        )}

        {(error || authError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {authError ?? "Authentication failed. Please try again."}
          </div>
        )}

        {/* Mode tabs — only shown when LDAP is enabled */}
        {ldapEnabled && (
          <div className="flex rounded-lg border border-gray-200 p-1 mb-6 gap-1">
            <button
              type="button"
              onClick={() => { setMode("credentials"); setAuthError(null); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === "credentials"
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Local Account
            </button>
            <button
              type="button"
              onClick={() => { setMode("ldap"); setAuthError(null); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === "ldap"
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Directory (LDAP / AD)
            </button>
          </div>
        )}

        {/* Local credentials form */}
        {mode === "credentials" && (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}

        {/* LDAP / Active Directory form */}
        {mode === "ldap" && (
          <form onSubmit={handleLdap} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              Use your corporate directory username — e.g. <code className="font-mono">jsmith</code> or <code className="font-mono">jsmith@company.com</code>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="jsmith or jsmith@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Authenticating..." : "Sign in with Directory"}
            </button>
          </form>
        )}

        {/* Microsoft SSO */}
        {process.env.NEXT_PUBLIC_MS_SSO_ENABLED === "true" && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-500">
                <span className="px-2 bg-white">or continue with</span>
              </div>
            </div>
            <button
              onClick={handleMicrosoft}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                <path d="M1 1h10v10H1z" fill="#F25022" />
                <path d="M12 1h10v10H12z" fill="#7FBA00" />
                <path d="M1 12h10v10H1z" fill="#00A4EF" />
                <path d="M12 12h10v10H12z" fill="#FFB900" />
              </svg>
              Sign in with Microsoft
            </button>
          </>
        )}
      </div>
    </div>
  );
}
