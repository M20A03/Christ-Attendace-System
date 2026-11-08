"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithCredentials } from "@/lib/api";
import { hasActiveSession, initiateKeycloakLogin } from "@/lib/auth";
import {
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  CalendarCheck,
  FileSpreadsheet,
  Award,
} from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isNative, setIsNative] = useState(false);

  // Form fields for web fallback
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Check if running on Android/iOS native Capacitor wrapper
  useEffect(() => {
    import("@/lib/nativeAuth").then(({ isNativeApp }) => {
      setIsNative(isNativeApp());
    });
  }, []);

  const handleNativeLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { startNativePortalLogin } = await import("@/lib/nativeAuth");
      const res = await startNativePortalLogin();
      if (res.success) {
        router.replace("/dashboard");
      } else if (res.error && res.error !== "Login cancelled") {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to launch portal login");
    } finally {
      setLoading(false);
    }
  };

  // Auto-redirect if already signed in
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
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
        undefined,
        rememberMe
      );
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Unable to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    initiateKeycloakLogin(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-[#0f2b5c]/10 selection:text-[#0f2b5c]">
      {/* Top University Brand Bar */}
      <header className="max-w-4xl mx-auto w-full px-5 py-4 flex items-center justify-between border-b border-slate-200/90">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-2xl bg-[#0f2b5c] text-white flex items-center justify-center font-bold text-xs tracking-wider border border-[#1e3a8a] shadow-sm select-none"
          >
            CU
          </motion.div>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight block">
              Christ University
            </span>
            <span className="text-[11px] text-slate-500 font-mono block">
              Student Attendance & Academic Suite
            </span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleDemoLogin}
          type="button"
          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors shadow-sm"
        >
          Sample Preview
        </motion.button>
      </header>

      {/* Main Container */}
      <div className="max-w-md mx-auto w-full px-5 py-8 flex flex-col items-center">
        {sessionExpired && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2.5 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>Session expired. Please sign in again to refresh your attendance.</span>
          </div>
        )}

        <div className="text-center space-y-2 mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Know your attendance before walking into class.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
            Live subject tracking, safe-skip predictions, and CIA marks synced directly from the official Christ University portal.
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-6 shadow-[0_4px_24px_rgba(15,43,92,0.05)] space-y-5">
          {isNative ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1">
                <span className="text-xs font-bold text-slate-900 block">
                  1-Tap Official Sign In
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sign in through the official Christ University portal. Your live courses, safe skips, and attendance sync automatically to this device for 30 days.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleNativeLogin}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#0f2b5c] hover:bg-[#163b7d] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Syncing Live Attendance...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In via Official CUE Portal</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handlePasswordLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Register Number or Christ Email
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. 2347101 or name@science.christuniversity.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] transition-all pr-10 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#0f2b5c] focus:ring-[#0f2b5c]"
                    />
                    <span>Remember on this device (30 days)</span>
                  </label>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-2xl bg-[#0f2b5c] hover:bg-[#163b7d] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>Sign In to View Attendance</span>
                  )}
                </motion.button>
              </form>
            </div>
          )}
        </div>

        {/* 3 Real Feature Highlights (Non-Generic) */}
        <div className="w-full mt-8 grid grid-cols-1 gap-3 text-left">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(15,43,92,0.03)] flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Safe-Skips Calculator
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                Know the exact number of classes you can miss while staying safely above the mandatory 85% requirement.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(15,43,92,0.03)] flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Blue & Yellow Form Claims
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                Factor in your approved Blue Form (medical leave) and Yellow Form (duty leave for fests, sports & hackathons) to project your true exam eligibility.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(15,43,92,0.03)] flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                CIA & End-Sem Marks Predictor
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                Calculate scaled internal scores and see the exact question paper score needed to secure your target grade on Christ 4.0 scale.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clean University Footer */}
      <footer className="max-w-4xl mx-auto w-full px-5 py-4 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 font-medium">
        <p>Christ Attendance • Built for Christ University Students</p>
        <p className="font-mono text-[11px]">Official CUE Academic Portal Sync</p>
      </footer>
    </main>
  );
}
