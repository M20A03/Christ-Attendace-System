"use client";

import React from "react";
import { calculateAttendanceMetrics } from "@/lib/calculations";

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

  const metrics = calculateAttendanceMetrics(attended, total, 0.85);

  // Dynamic color selection based on percentage
  const getColorScheme = () => {
    if (percentage >= 85) {
      return {
        stroke: "#10b981", // emerald-500
        gradientId: "emeraldGradient",
        startColor: "#34d399",
        endColor: "#059669",
        text: "text-emerald-400 dark:text-emerald-400",
        bgBadge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        label: "Safe Attendance",
      };
    } else if (percentage >= 75) {
      return {
        stroke: "#f59e0b", // amber-500
        gradientId: "amberGradient",
        startColor: "#fbbf24",
        endColor: "#d97706",
        text: "text-amber-400 dark:text-amber-400",
        bgBadge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        label: "Warning Zone",
      };
    } else {
      return {
        stroke: "#f43f5e", // rose-500
        gradientId: "roseGradient",
        startColor: "#fb7185",
        endColor: "#e11d48",
        text: "text-rose-400 dark:text-rose-400",
        bgBadge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        label: "Critical Shortage",
      };
    }
  };

  const colors = getColorScheme();

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-950/5 dark:shadow-black/40 backdrop-blur-md">
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 filter drop-shadow-md"
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
            className="text-slate-100 dark:text-slate-800/80 fill-none"
          />

          {/* Animated active progress */}
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
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
            Overall
          </span>
          <span className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            {percentage}
            <span className="text-2xl font-bold ml-0.5 text-slate-400 dark:text-slate-400">%</span>
          </span>
          <span
            className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bgBadge}`}
          >
            {colors.label}
          </span>
        </div>
      </div>

      {/* Breakdown stat pills */}
      <div className="grid grid-cols-3 gap-3 w-full mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
        <div className="text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">Attended</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{attended}</p>
        </div>
        <div className="text-center border-x border-slate-100 dark:border-slate-800/80">
          <p className="text-xs text-slate-400 dark:text-slate-500">Total</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{total}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">Safe Skips</p>
          <p className={`text-lg font-bold ${colors.text}`}>{metrics.safeSkips}</p>
        </div>
      </div>
    </div>
  );
};

