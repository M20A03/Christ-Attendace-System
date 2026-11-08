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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#080d1a]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/80 shadow-[0_1px_8px_rgba(15,43,92,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Technical typographic app mark & student info */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight tracking-tight">
                {student?.name || "Student"}
              </h1>
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            </div>
            <p className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
              Reg: {student?.reg_number || "Student ID"}
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
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-800"
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
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 border border-slate-200/60 dark:border-slate-800"
              title="Refresh attendance"
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
