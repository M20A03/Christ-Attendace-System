"use client";

import React from "react";
import { SubjectAttendance } from "@/lib/api";
import { calculateAttendanceMetrics } from "@/lib/calculations";
import { CheckCircle2, AlertTriangle, AlertCircle, User } from "lucide-react";
import { motion } from "framer-motion";

interface SubjectCardProps {
  subject: SubjectAttendance;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  const metrics = calculateAttendanceMetrics(subject.attended, subject.total, 0.85);

  const getStatusStyling = () => {
    switch (metrics.status) {
      case "safe":
        return {
          barColor: "bg-emerald-500",
          badgeBg:
            "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1.5 flex-shrink-0" />,
          adviceColor: "text-emerald-700 dark:text-emerald-300",
        };
      case "warning":
        return {
          barColor: "bg-amber-500",
          badgeBg:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-1.5 flex-shrink-0" />,
          adviceColor: "text-amber-700 dark:text-amber-300",
        };
      case "danger":
      default:
        return {
          barColor: "bg-rose-500",
          badgeBg:
            "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
          icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mr-1.5 flex-shrink-0" />,
          adviceColor: "text-rose-700 dark:text-rose-300",
        };
    }
  };

  const styling = getStatusStyling();

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(15,43,92,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:shadow-md transition-all flex flex-col justify-between"
    >
      <div>
        {/* Header with subject name & percentage badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {subject.subject_code && (
              <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {subject.subject_code}
              </span>
            )}
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2">
              {subject.name}
            </h3>
            {subject.faculty && (
              <p className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                <User className="w-3 h-3 mr-1 opacity-70" />
                <span className="truncate">{subject.faculty}</span>
              </p>
            )}
          </div>

          <div
            className={`px-2.5 py-1 rounded-xl text-xs font-black border flex-shrink-0 font-mono ${styling.badgeBg}`}
          >
            {subject.percentage}%
          </div>
        </div>

        {/* Progress Bar & Class Count */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>Conducted vs Attended</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              {subject.attended} / {subject.total} classes
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${styling.barColor}`}
              style={{ width: `${Math.min(subject.percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actionable Skip / Need Status line */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center font-bold">
          {styling.icon}
          <span className={styling.adviceColor}>{metrics.message}</span>
        </div>
      </div>
    </motion.div>
  );
};
