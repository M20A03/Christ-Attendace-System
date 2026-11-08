"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PieChart, Calculator, Building2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const [isHostelite, setIsHostelite] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("cu_cached_hostel");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.is_hostelite === true) {
          setIsHostelite(true);
        }
      }
    } catch {}
  }, []);

  // Standard student items: Attendance, Calculator, Confessions
  // If verified hostel resident, includes Hostel Biometrics tab
  const navItems = [
    {
      label: "Attendance",
      href: "/dashboard",
      icon: PieChart,
    },
    {
      label: "Calculator",
      href: "/calculator",
      icon: Calculator,
    },
    ...(isHostelite
      ? [
          {
            label: "Hostel",
            href: "/hostel",
            icon: Building2,
          },
        ]
      : []),
    {
      label: "Confessions",
      href: "/confessions",
      icon: MessageSquare,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#080d1a]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/80 shadow-[0_-4px_24px_rgba(15,43,92,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)] pb-safe transition-colors duration-200">
      <div className="max-w-lg mx-auto px-1 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center flex-1 max-w-[76px] py-1.5 group select-none"
            >
              <div className="relative p-1.5 flex items-center justify-center">
                {isActive && (
                  <motion.div
                    layoutId="bottomNavHighlight"
                    className="absolute inset-0 bg-[#0f2b5c]/10 dark:bg-blue-500/20 rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                    isActive
                      ? "text-[#0f2b5c] dark:text-blue-400"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-semibold tracking-tight transition-colors duration-200 mt-0.5 truncate max-w-full px-0.5 text-center ${
                  isActive
                    ? "text-[#0f2b5c] dark:text-blue-400 font-bold"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="bottomNavDot"
                  className="absolute bottom-1 w-1 h-1 bg-[#0f2b5c] dark:bg-blue-400 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
