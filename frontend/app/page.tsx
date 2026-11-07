"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithCredentials } from "@/lib/api";
import { hasActiveSession, initiateKeycloakLogin } from "@/lib/auth";
import { EsproTokenModal } from "@/components/EsproTokenModal";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [studentName, setStudentName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Auto-redirect if already signed in on this phone/browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("expired") === "true") {
        setSessionExpired(true);
      } else if (hasActiveSession()) {
        router.replace("/dashboard");
      }
    }
  }, [router]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your Register Number or Christ Email.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginWithCredentials(
        username.trim(),
        password.trim(),
        studentName.trim() || undefined,
        rememberMe
      );
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Unable to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    initiateKeycloakLogin(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
      {/* Top University Brand Bar */}
      <header className="max-w-4xl mx-auto w-full px-5 py-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0f2b5c] text-white flex items-center justify-center font-bold text-xs tracking-wider border border-[#1e3a8a] shadow-sm">
            CU
          </div>
          <div>
            <span className="font-semibold text-slate-900 dark:text-white text-sm tracking-tight block">
              Christ University
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
              Student Attendance & Academic Portal
            </span>
          </div>
        </div>

        <button
          onClick={handleDemoLogin}
          type="button"
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
        >
          Sample Preview
        </button>
      </header>

      {/* Main Login Area */}
      <div className="max-w-md mx-auto w-full px-5 py-8 flex flex-col items-center">
        {sessionExpired && (
          <div className="w-full mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 flex items-center gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Your session ended. Please sign in again to view your updated attendance.</span>
          </div>
        )}

        {/* Academic Shield Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Christ Student Attendance & Safe Skips</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white text-center leading-tight">
          Sign In to Your Account
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
          Enter your credentials once. Your phone stays securely logged in so you never have to sign in again.
        </p>

        {/* Primary Login Card */}
        <div className="w-full mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePasswordLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Register Number or Christ Email
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. 2347101 or name@science.christuniversity.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Portal Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student Full Name <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Mayank Raj"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 transition-all"
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Stay signed in on this phone
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-[#0f2b5c] hover:bg-[#1e3a8a] text-white text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Sign In & View Attendance</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Guarantee */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              AES-256-GCM Encrypted at rest
            </span>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="text-slate-700 dark:text-slate-300 hover:underline font-medium"
            >
              Sample Preview →
            </button>
          </div>
        </div>

        {/* Secondary Option: Token Modal */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsTokenModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>Developer / Live ESPRO Token Connect</span>
          </button>
        </div>
      </div>

      {/* Clean University Footer */}
      <footer className="max-w-4xl mx-auto w-full px-5 py-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <p>Christ Attendance Viewer • Built for Christ University Students</p>
        <p className="font-mono text-[11px]">PWA Version 1.3 • Light Theme</p>
      </footer>

      {/* ESPRO Live Token Modal */}
      <EsproTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
      />
    </main>
  );
}
