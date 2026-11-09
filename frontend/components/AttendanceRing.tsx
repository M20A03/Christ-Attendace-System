"use client";

import React from "react";
import { calculateAttendanceMetrics } from "@/lib/calculations";
import { motion } from "framer-motion";

interface AttendanceRingProps {
  percentage: number;
  attended: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export const AttendanceRing: React.FC<AttendanceRingProps> = ({
  percentage,
  attended,
  total,
  size = 230,
  strokeWidth = 16,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Clamp percentage between 0 and 100 for the SVG stroke
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  const metrics = calculateAttendanceMetrics(attended, total, 0.75);

  // Dynamic color selection based on percentage
  const getColorScheme = () => {
    if (percentage >= 85) {
      return {
        stroke: "#059669",
        gradientId: "emeraldGradient",
        startColor: "#10b981",
        endColor: "#059669",
        text: "text-emerald-600 dark:text-emerald-400",
        bgBadge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
        label: "Above 85% (End-Sem Goal Met)",
      };
    } else if (percentage >= 75) {
      return {
        stroke: "#2563eb",
        gradientId: "blueGradient",
        startColor: "#3b82f6",
        endColor: "#1d4ed8",
        text: "text-blue-600 dark:text-blue-400",
        bgBadge: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
        label: "Eligible (75%+) • Mid-Sem Safe",
      };
    } else {
      return {
        stroke: "#e11d48",
        gradientId: "roseGradient",
        startColor: "#f43f5e",
        endColor: "#be123c",
        text: "text-rose-600 dark:text-rose-400",
        bgBadge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
        label: "Shortage (< 75%)",
      };
    }
  };

  const colors = getColorScheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 26 }}
      className="relative flex flex-col items-center justify-center p-6 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_4px_24px_-2px_rgba(15,43,92,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 overflow-hidden"
    >
      {/* Subtle ambient colored glow behind the ring */}
      <div
        className="absolute top-12 w-48 h-48 rounded-full blur-3xl opacity-15 dark:opacity-25 pointer-events-none transition-all duration-700"
        style={{ background: colors.startColor }}
      />

      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 filter drop-shadow-sm"
        >
          <defs>
            <linearGradient id={colors.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.startColor} />
              <stop offset="100%" stopColor={colors.endColor} />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800/90 fill-none"
          />

          {/* Animated active progress with Emil spring feel */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${colors.gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="fill-none transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center percentage display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
            Aggregate
          </span>
          <span className="text-5xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            {percentage}
            <span className="text-2xl font-bold ml-0.5 text-slate-400 dark:text-slate-500">%</span>
          </span>
          <span
            className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colors.bgBadge} shadow-2xs`}
          >
            {colors.label}
          </span>
        </div>
      </div>

      {/* Breakdown stat pills */}
      <div className="grid grid-cols-3 gap-2.5 w-full mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
        <div className="text-center p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Attended</p>
          <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 font-mono">{attended}</p>
        </div>
        <div className="text-center p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total</p>
          <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 font-mono">{total}</p>
        </div>
        <div className="text-center p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Safe Skips</p>
          <p className={`text-lg font-black mt-0.5 font-mono ${colors.text}`}>{metrics.safeSkips}</p>
        </div>
      </div>
    </motion.div>
  );
};
