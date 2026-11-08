"use client";

import React, { useEffect } from "react";
import { StudentInfo } from "@/lib/auth";
import { logoutUser } from "@/lib/api";
import { LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

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
  // Enforce Light Theme across the entire application
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, []);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await logoutUser();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_1px_8px_rgba(15,43,92,0.03)]">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Christ University crest badge & student info */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-2xl bg-[#0f2b5c] text-white flex items-center justify-center font-bold text-xs tracking-wider border border-[#1e3a8a] shadow-sm select-none"
          >
            CU
          </motion.div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-900 text-sm leading-tight tracking-tight">
                {student?.name || "Christ Student"}
              </h1>
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            </div>
            <p className="text-[11px] font-mono font-medium text-slate-500">
              Reg: {student?.reg_number || "Student"}
            </p>
          </div>
        </div>

        {/* Right actions: Refresh, Logout */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50 border border-transparent hover:border-slate-200"
              title="Refresh attendance"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`}
              />
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};
