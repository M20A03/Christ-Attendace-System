"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PieChart, Calculator, Award, Building2 } from "lucide-react";
import { motion } from "framer-motion";

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  // Page 1: Attendance, Page 2: Calculator, Page 3: Marks Card, Page 4: Hostel
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
    {
      label: "Marks Card",
      href: "/marks",
      icon: Award,
    },
    {
      label: "Hostel",
      href: "/hostel",
      icon: Building2,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(15,43,92,0.06)] pb-safe">
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-20 py-1.5 group select-none"
            >
              <div className="relative p-1.5 flex items-center justify-center">
                {isActive && (
                  <motion.div
                    layoutId="bottomNavHighlight"
                    className="absolute inset-0 bg-[#0f2b5c]/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                    isActive ? "text-[#0f2b5c]" : "text-slate-500 group-hover:text-slate-700"
                  }`}
                />
              </div>
              <span
                className={`text-[11px] font-semibold tracking-tight transition-colors duration-200 mt-0.5 truncate max-w-full px-0.5 ${
                  isActive ? "text-[#0f2b5c]" : "text-slate-500 group-hover:text-slate-700"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="bottomNavDot"
                  className="absolute bottom-1 w-1 h-1 bg-[#0f2b5c] rounded-full"
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
