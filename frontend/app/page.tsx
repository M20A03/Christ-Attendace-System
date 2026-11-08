"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginWithCredentials, loginWithEsproToken } from "@/lib/api";
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
  Download,
  Smartphone,
  Apple,
  KeyRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isAppInstalled } from "@/lib/platform";
import { EsproTokenModal } from "@/components/EsproTokenModal";

export default function LandingPage() {
  const router = useRouter();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [isInstalled, setIsInstalled] = useState(true);
  const [showTokenModal, setShowTokenModal] = useState(false);

  // Form fields for web fallback
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Check if running on Android/iOS native Capacitor wrapper or standalone PWA
  useEffect(() => {
    setIsInstalled(isAppInstalled());
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

  // Auto-redirect if already signed in, or handle direct token query
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get("token");
      if (tokenParam) {
        setLoading(true);
        loginWithEsproToken(tokenParam)
          .then(() => router.replace("/dashboard"))
          .catch((err) => {
            setError(err?.message || "Failed to log in with session token.");
            setLoading(false);
          });
        return;
      }
      if (params.get("expired")) {
        setSessionExpired(true);
      } else if (hasActiveSession()) {
        router.replace("/dashboard");
      }
    }
  }, [router]);

  const handlePortalLogin = () => {
    setError(null);
    setLoading(true);
    initiateKeycloakLogin();
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginWithCredentials(
        username.trim(),
        password,
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
    <main className="min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#0f2b5c]/10 selection:text-[#0f2b5c] dark:selection:bg-blue-500/20 dark:selection:text-blue-300 transition-colors duration-200">
      {/* Top University Brand Bar */}
      <header className="max-w-4xl mx-auto w-full px-5 py-4 flex items-center justify-between border-b border-slate-200/90 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-2xl bg-slate-950 dark:bg-slate-900 flex flex-col items-center justify-center border border-slate-800 dark:border-slate-700 shadow-xs select-none px-1"
          >
            <span className="font-mono text-[9px] font-black tracking-wider text-white leading-none">
              CHRIST
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <span className="text-[7px] font-mono font-bold text-slate-400 tracking-widest">
                SYS
              </span>
            </div>
          </motion.div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight block">
              Christ Portal
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
              Academic & Attendance Suite
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {!isInstalled && (
            <Link
              href="/download"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get App</span>
            </Link>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDemoLogin}
            type="button"
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-xs hidden sm:block"
          >
            Sample Preview
          </motion.button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-md mx-auto w-full px-5 py-8 flex flex-col items-center">
        {sessionExpired && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 flex items-center gap-2.5 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Session expired. Please sign in again to refresh your attendance.</span>
          </div>
        )}

        <div className="text-center space-y-2 mb-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Know your attendance before walking into class.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed font-medium">
            Live subject tracking, safe-skip predictions, and campus confessions synced directly from the official Christ University portal.
          </p>
        </div>

        {/* Dedicated Two Fixed Download Buttons for Android & iOS */}
        {!isInstalled && (
          <div className="w-full mb-6 grid grid-cols-2 gap-3 select-none">
            {/* Android Direct APK Button */}
            <a
              href="/ChristAttendance.apk"
              download="ChristAttendance.apk"
              className="relative p-3.5 sm:p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:shadow-lg transition-all flex flex-col items-start justify-between border border-emerald-500 group overflow-hidden active:scale-[0.98]"
            >
              <div className="w-full flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white text-emerald-900 uppercase tracking-wider">
                  Direct APK
                </span>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-extrabold block tracking-tight leading-tight">
                  Download for Android
                </span>
                <span className="text-[10px] text-emerald-100 font-medium block mt-0.5">
                  1-Tap Direct Install (.apk)
                </span>
              </div>
            </a>

            {/* iPhone / iOS Button */}
            <Link
              href="/download"
              className="relative p-3.5 sm:p-4 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-md hover:shadow-lg transition-all flex flex-col items-start justify-between border border-slate-700/80 group overflow-hidden active:scale-[0.98]"
            >
              <div className="w-full flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Apple className="w-4 h-4" />
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500 text-white uppercase tracking-wider">
                  iPhone / iOS
                </span>
              </div>
              <div>
                <span className="text-xs sm:text-sm font-extrabold block tracking-tight leading-tight">
                  Install for iPhone
                </span>
                <span className="text-[10px] text-slate-300 font-medium block mt-0.5">
                  Safari Setup (3 Steps)
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Login Card */}
        <div className="w-full bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-200/90 dark:border-slate-800/80 p-6 shadow-[0_4px_24px_rgba(15,43,92,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-5">
          {isNative ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  1-Tap Official Sign In
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sign in through the official Christ University portal. Your live courses, safe skips, and attendance sync automatically to this device for 30 days.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleNativeLogin}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#0f2b5c] dark:bg-blue-600 hover:bg-[#163b7d] dark:hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-75"
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
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCredentialLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student Register / Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. 2347101 or student@christuniversity.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] dark:focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    KP Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] dark:focus:ring-blue-500 transition-all pr-10"
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

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-[#0f2b5c] dark:text-blue-500 focus:ring-[#0f2b5c]"
                    />
                    <span>Remember on this device</span>
                  </label>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#0f2b5c] dark:bg-blue-600 hover:bg-[#163b7d] dark:hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Student Portal</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </motion.button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowTokenModal(true)}
                    className="text-[11px] text-[#0f2b5c] dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Connect directly with CUE / ESPRO Session Token</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* 3 Real Feature Highlights (Non-Generic Bento cards) */}
        <div className="w-full mt-8 grid grid-cols-1 gap-3 text-left">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(15,43,92,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-100 dark:border-emerald-800/50">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Safe-Skips Calculator
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
                Know the exact number of classes you can miss while staying safely above the mandatory 85% requirement.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(15,43,92,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-100 dark:border-blue-800/50">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Blue & Yellow Form Claims
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
                Factor in your approved Blue Form (medical leave) and Yellow Form (duty leave for fests, sports & hackathons) to project your true exam eligibility.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(15,43,92,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-purple-100 dark:border-purple-800/50">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Anonymous Campus Confessions
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
                Share authentic campus thoughts and experiences. Every confession automatically disappears in 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Sticky Two-Button Bar for Mobile Web Users */}
      {!isInstalled && (
        <aside aria-label="Quick App Install" className="fixed bottom-3 left-3 right-3 sm:hidden z-40">
          <div className="bg-slate-950/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-2 rounded-2xl shadow-2xl grid grid-cols-2 gap-2">
            <a
              href="/ChristAttendance.apk"
              download="ChristAttendance.apk"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-transform"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android APK</span>
            </a>
            <Link
              href="/download"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-transform"
            >
              <Apple className="w-3.5 h-3.5" />
              <span>iPhone (iOS)</span>
            </Link>
          </div>
        </aside>
      )}

      {/* Clean University Footer */}
      <footer className="max-w-4xl mx-auto w-full px-5 py-4 border-t border-slate-200/90 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 font-medium">
        <p>Christ Attendance • Built for Christ University Students</p>
        <p className="font-mono text-[11px]">Official CUE Academic Portal Sync</p>
      </footer>

      {/* CUE Token Modal */}
      <EsproTokenModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
      />
    </main>
  );
}
