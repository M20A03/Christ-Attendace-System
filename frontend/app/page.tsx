"use client";

import React, { useEffect, useState } from "react";
import { initiateKeycloakLogin } from "@/lib/auth";
import { EsproTokenModal } from "@/components/EsproTokenModal";
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  KeyRound,
  ExternalLink,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export default function LandingPage() {
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("expired") === "true") {
        setSessionExpired(true);
      }
    }
  }, []);

  const handleKeycloakLogin = () => {
    setLoading(true);
    initiateKeycloakLogin(false);
  };

  const handleDemoLogin = () => {
    initiateKeycloakLogin(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
      {/* Top University Brand Bar */}
      <header className="max-w-4xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-bold text-base tracking-tight shadow-sm">
            CU
          </div>
          <div>
            <span className="font-semibold text-slate-900 dark:text-white text-sm tracking-tight block">
              Christ University Attendance
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
              Student Information & Analytics
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDemoLogin}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Sample Preview
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-2xl mx-auto w-full px-6 py-12 flex flex-col items-center text-center">
        {sessionExpired && (
          <div className="w-full mb-8 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-3 text-left">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-medium">
              Your session has expired. Please connect your credentials again to refresh attendance records.
            </p>
          </div>
        )}

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Independent Student Academic Portal</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-950 dark:text-white leading-tight">
          Track Attendance & Calculate Safe Skips
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
          Clean, mobile-first analytics for Christ University students. Calculate exactly how many classes you can skip while maintaining the required 85% attendance.
        </p>

        {/* Primary Action Card */}
        <div className="w-full mt-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm text-left space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
            Choose Login Method
          </h2>

          <div className="space-y-3">
            {/* Method 1: Live ESPRO Token */}
            <button
              onClick={() => setIsTokenModalOpen(true)}
              className="w-full p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                      Connect Live ESPRO Token
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Syncs directly with your current live session from cue.christuniversity.in
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 transform group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Method 2: Keycloak Redirect */}
            <button
              onClick={handleKeycloakLogin}
              disabled={loading}
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    Keycloak OIDC Single Sign-On
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Official authorization code flow with PKCE
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              AES-256-GCM Encrypted at rest
            </span>
            <button
              onClick={handleDemoLogin}
              className="text-slate-700 dark:text-slate-300 hover:underline font-medium"
            >
              Explore sample dashboard →
            </button>
          </div>
        </div>

        {/* Real Portal Guide Note */}
        <div className="mt-8 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Need your token? Log in to</span>
          <a
            href="https://cue.christuniversity.in"
            target="_blank"
            rel="noreferrer"
            className="text-slate-700 dark:text-slate-300 font-medium underline inline-flex items-center gap-0.5"
          >
            cue.christuniversity.in <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Clean University Footer */}
      <footer className="max-w-4xl mx-auto w-full px-6 py-6 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
        <p>Christ Attendance Viewer • Built for Christ University Students</p>
        <p className="font-mono text-[11px]">PWA Version 1.2 • Light Theme</p>
      </footer>

      {/* ESPRO Live Token Modal */}
      <EsproTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
      />
    </main>
  );
}
