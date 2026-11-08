"use client";

import React, { useState, useEffect } from "react";
import { StudentInfo } from "@/lib/auth";
import { logoutUser } from "@/lib/api";
import { LogOut, RefreshCw, Moon, Sun, ShieldCheck } from "lucide-react";

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
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme === "dark") {
        document.documentElement.classList.add("dark");
        setIsDark(true);
      } else {
        document.documentElement.classList.remove("dark");
        setIsDark(false);
      }
    }
  }, []);

  const toggleDarkMode = () => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      if (root.classList.contains("dark")) {
        root.classList.remove("dark");
        setIsDark(false);
        localStorage.setItem("theme", "light");
      } else {
        root.classList.add("dark");
        setIsDark(true);
        localStorage.setItem("theme", "dark");
      }
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await logoutUser();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Christ University crest badge & student info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0f2b5c] text-white flex items-center justify-center font-bold text-xs tracking-wider border border-[#1e3a8a] shadow-sm">
            CU
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                {student?.name || "Christ Student"}
              </h1>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            </div>
            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Reg: {student?.reg_number || "Student"}
            </p>
          </div>
        </div>

        {/* Right actions: Refresh, Theme Toggle, Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              title="Refresh attendance"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-500" : ""}`}
              />
            </button>
          )}

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Sign out of device"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
