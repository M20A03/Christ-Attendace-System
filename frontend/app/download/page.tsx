"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Download,
  Share,
  PlusSquare,
  Smartphone,
  Apple,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ChevronRight,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DownloadPage() {
  const [activePlatform, setActivePlatform] = useState<"android" | "ios">("android");

  const APK_DOWNLOAD_URL =
    "https://github.com/M20A03/Christ-Attendace-System/releases/download/latest-apk/ChristAttendance.apk";
  const GITHUB_RELEASE_URL =
    "https://github.com/M20A03/Christ-Attendace-System/releases/tag/latest-apk";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#0f2b5c]/10 selection:text-[#0f2b5c] dark:selection:bg-blue-500/20 dark:selection:text-blue-300 transition-colors duration-200">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full px-5 py-4 flex items-center justify-between border-b border-slate-200/90 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 dark:bg-slate-900 flex flex-col items-center justify-center border border-slate-800 dark:border-slate-700 shadow-xs select-none px-1">
              <span className="font-mono text-[9px] font-black tracking-wider text-white leading-none">
                CHRIST
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span className="text-[7px] font-mono font-bold text-slate-400 tracking-widest">
                  SYS
                </span>
              </div>
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-tight block">
                Christ Attendance
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                App Installation Center
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/"
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
          >
            Web Portal
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Select Your Device</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Install on your Phone
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Follow the quick steps below for Android or iPhone to get full-screen attendance, safe skips, hostel punches & confessions on your phone.
          </p>
        </div>

        {/* 2-Option Platform Switcher */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-850/90 border border-slate-300/60 dark:border-slate-800 shadow-inner">
          <button
            onClick={() => setActivePlatform("android")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${
              activePlatform === "android"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android</span>
          </button>

          <button
            onClick={() => setActivePlatform("ios")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-black transition-all ${
              activePlatform === "ios"
                ? "bg-[#0f2b5c] dark:bg-blue-600 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iPhone (iOS)</span>
          </button>
        </div>

        {/* Content Box for Selected Platform */}
        <AnimatePresence mode="wait">
          {activePlatform === "android" ? (
            /* ======================================================== */
            /* OPTION 1: ANDROID DOWNLOAD & INSTRUCTIONS                */
            /* ======================================================== */
            <motion.div
              key="android"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Primary Direct Download Card */}
              <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_4px_24px_rgba(15,43,92,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                        Android APK Package
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Version 2.0 • Direct APK File
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                    Latest Build
                  </span>
                </div>

                <a
                  href={APK_DOWNLOAD_URL}
                  download="ChristAttendance.apk"
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Download APK (Direct)</span>
                </a>

                <div className="text-center">
                  <a
                    href={GITHUB_RELEASE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    <span>View GitHub Release</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Step-by-Step Android Instructions */}
              <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_4px_24px_rgba(15,43,92,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>How to Install on Android</span>
                </h4>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Tap "Download APK" above
                      </strong>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Chrome will start downloading <code>ChristAttendance.apk</code>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        If Chrome shows "File might be harmful"
                      </strong>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Tap <strong>"Download anyway"</strong>. (Android displays this safety warning for any app installed outside Google Play).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Open Notification & Tap Install
                      </strong>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Tap the downloaded file. If Android asks for permission, tap <strong>Settings</strong> $\rightarrow$ toggle <strong>"Allow from this source"</strong> $\rightarrow$ tap <strong>Install</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Launch & Sign In
                      </strong>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Open <strong>Christ Attendance</strong> and log in directly through the official portal.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ======================================================== */
            /* OPTION 2: IPHONE (iOS) INSTRUCTIONS                     */
            /* ======================================================== */
            <motion.div
              key="ios"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* iPhone Overview Card */}
              <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_4px_24px_rgba(15,43,92,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0f2b5c] dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
                      <Apple className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                        iPhone / iPad Installation
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Runs full-screen with zero browser bars
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold">
                    iOS Safari
                  </span>
                </div>

                <Link
                  href="/"
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#0f2b5c] dark:bg-blue-600 hover:bg-[#163b7d] dark:hover:bg-blue-500 active:scale-98 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 text-center"
                >
                  <Globe className="w-4 h-4" />
                  <span>Open App in Safari</span>
                </Link>
              </div>

              {/* Step-by-Step iPhone Instructions */}
              <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_4px_24px_rgba(15,43,92,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0f2b5c] dark:text-blue-400" />
                  <span>3 Easy Steps for iPhone</span>
                </h4>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="w-6 h-6 rounded-full bg-[#0f2b5c] dark:bg-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Open in Safari
                      </strong>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Ensure you are viewing this link inside Apple <strong>Safari</strong> on your iPhone.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="w-6 h-6 rounded-full bg-[#0f2b5c] dark:bg-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        <span>Tap the Share Button</span>
                        <Share className="w-3.5 h-3.5 text-blue-500" />
                      </strong>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Tap the square icon with an upward arrow at the bottom of Safari.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="w-6 h-6 rounded-full bg-[#0f2b5c] dark:bg-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        <span>Select "Add to Home Screen"</span>
                        <PlusSquare className="w-3.5 h-3.5 text-slate-400" />
                      </strong>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Scroll down and tap <strong>"Add to Home Screen"</strong> $\rightarrow$ tap <strong>Add</strong> in the top right.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>The app will now launch directly from your iPhone home screen in full screen without any Safari address bar!</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Or Continue to Web Portal */}
        <div className="pt-2 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <span>Or continue to Web Portal in browser</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full px-5 py-4 border-t border-slate-200/90 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 font-medium">
        <p>Christ Attendance • Student Academic Suite</p>
        <p className="font-mono text-[11px]">Direct APK & PWA Engine</p>
      </footer>
    </div>
  );
}

