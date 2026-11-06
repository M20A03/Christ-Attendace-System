"use client";

import React, { useEffect, useState } from "react";
import { initiateKeycloakLogin } from "@/lib/auth";
import {
  ShieldCheck,
  PieChart,
  Calculator,
  Lock,
  ArrowRight,
  Sparkles,
  Smartphone,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function LandingPage() {
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("expired") === "true") {
        setSessionExpired(true);
      }
    }
  }, []);

  const handleLogin = (isDemo = false) => {
    setLoading(true);
    initiateKeycloakLogin(isDemo);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none blur-3xl -z-10" />

      {/* Header bar */}
      <header className="max-w-5xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/25">
            CU
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight text-sm sm:text-base">
              Christ Attendance
            </span>
            <span className="block text-[11px] text-slate-400 font-mono">PWA Edition</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLogin(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Demo Preview
          </button>
        </div>
      </header>

      {/* Main hero content */}
      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col items-center text-center">
        {/* Session expired alert notification */}
        {sessionExpired && (
          <div className="w-full mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-medium text-left">
              Your session has expired. Please log in again to continue viewing your live records.
            </p>
          </div>
        )}

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Built exclusively for Christ University Students</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Your university attendance,{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            elevated & beautiful.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
          Log in with your official university credentials. View circular attendance progress, calculate safe skips, and track internal marks with clarity.
        </p>

        {/* Action Buttons */}
        <div className="mt-9 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <button
            onClick={() => handleLogin(false)}
            disabled={loading}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-75"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Login with Christ University</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>

          <button
            onClick={() => handleLogin(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Explore with Sample Data</span>
          </button>
        </div>

        {/* Security pledge & privacy note */}
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <Lock className="w-3.5 h-3.5 text-emerald-500/80" />
          <span>Zero passwords stored • Keycloak PKCE OAuth • AES-GCM Encrypted</span>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 w-full text-left">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Circular Progress Rings</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Real-time visualization with emerald (≥85%), amber (75–84%), and rose (&lt;75%) status bands.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center mb-3">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Safe Skip Calculator</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Find out exactly how many classes you can skip or need to attend to maintain your 85% goal.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Mobile PWA Ready</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Install directly to your iPhone or Android home screen with instant loading and native feel.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full px-6 py-8 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 gap-3">
        <p>© 2026 Christ Attendance Viewer • Independent student project</p>
        <div className="flex items-center gap-4">
          <a
            href="https://studentespro.christuniversity.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-500 transition-colors flex items-center gap-1"
          >
            Christ Keycloak Portal <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </main>
  );
}

