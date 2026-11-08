"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StudentInfo } from "@/lib/auth";
import { logoutUser } from "@/lib/api";
import { LogOut, RefreshCw, ShieldCheck, Download } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { isAppInstalled } from "@/lib/platform";

interface NavbarProps {
  student?: StudentInfo | null;
  lastUpdated?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  student,
  lastUpdated,
  onRefresh,
  isRefreshing = false,
}) => {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isAppInstalled());
  }, []);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await logoutUser();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#070c18]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-[0_4px_24px_-4px_rgba(15,43,92,0.06)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.6)] pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 px-1 transition-all duration-300 relative before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-blue-500/25 before:to-transparent">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
        {/* Left: Technical typographic app mark & student info */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -1 }}
            whileTap={{ scale: 0.94 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-850 dark:to-slate-950 flex flex-col items-center justify-center border border-slate-700/60 dark:border-slate-700/80 shadow-inner select-none px-1 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
            <span className="font-mono text-[9px] font-black tracking-widest text-slate-100 leading-none">
              CHRIST
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
              <span className="text-[7px] font-mono font-bold text-slate-400 tracking-wider">
                SYS
              </span>
            </div>
          </motion.div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight tracking-tight">
                {student?.name || "Student"}
              </h1>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
            <p className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Reg: <span className="font-bold text-slate-700 dark:text-slate-300">{student?.reg_number || "Student ID"}</span>
            </p>
          </div>
        </div>

        {/* Right actions: Theme toggle, Download app, Refresh, Logout */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {!isInstalled && (
            <Link
              href="/download"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-800 shadow-xs"
              title="Download App for Android or iPhone"
            >
              <Download className="w-4 h-4" />
            </Link>
          )}

          {onRefresh && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 border border-slate-200/80 dark:border-slate-800 shadow-xs"
              title="Refresh live attendance"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-600 dark:text-emerald-400" : ""}`}
              />
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-transparent hover:border-rose-100 dark:hover:border-rose-900/40"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};
