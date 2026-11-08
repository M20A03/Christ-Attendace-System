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

  const metrics = calculateAttendanceMetrics(attended, total, 0.85);

  // Dynamic color selection based on percentage
  const getColorScheme = () => {
    if (percentage >= 85) {
      return {
        stroke: "#059669",
        gradientId: "emeraldGradient",
        startColor: "#10b981",
        endColor: "#059669",
        text: "text-emerald-700",
        bgBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Safe Attendance (≥ 85%)",
      };
    } else if (percentage >= 75) {
      return {
        stroke: "#d97706",
        gradientId: "amberGradient",
        startColor: "#f59e0b",
        endColor: "#d97706",
        text: "text-amber-700",
        bgBadge: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Warning Zone (75%–85%)",
      };
    } else {
      return {
        stroke: "#e11d48",
        gradientId: "roseGradient",
        startColor: "#f43f5e",
        endColor: "#be123c",
        text: "text-rose-700",
        bgBadge: "bg-rose-50 text-rose-700 border-rose-200",
        label: "Critical Shortage (< 75%)",
      };
    }
  };

  const colors = getColorScheme();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_24px_rgba(15,43,92,0.05)]"
    >
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
            className="text-slate-100 fill-none"
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
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Aggregate
          </span>
          <span className="text-5xl font-black tracking-tight text-slate-900">
            {percentage}
            <span className="text-2xl font-bold ml-0.5 text-slate-400">%</span>
          </span>
          <span
            className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colors.bgBadge}`}
          >
            {colors.label}
          </span>
        </div>
      </div>

      {/* Breakdown stat pills */}
      <div className="grid grid-cols-3 gap-3 w-full mt-6 pt-5 border-t border-slate-100">
        <div className="text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Attended</p>
          <p className="text-lg font-black text-slate-900 mt-0.5">{attended}</p>
        </div>
        <div className="text-center border-x border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
          <p className="text-lg font-black text-slate-900 mt-0.5">{total}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Safe Skips</p>
          <p className={`text-lg font-black mt-0.5 ${colors.text}`}>{metrics.safeSkips}</p>
        </div>
      </div>
    </motion.div>
  );
};
