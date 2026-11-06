"use client";

import React from "react";
import { SubjectAttendance } from "@/lib/api";
import { calculateAttendanceMetrics } from "@/lib/calculations";
import { CheckCircle2, AlertTriangle, AlertCircle, User, BookOpen } from "lucide-react";

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
          barBg: "bg-emerald-500/10",
          badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5 flex-shrink-0" />,
          adviceColor: "text-emerald-600 dark:text-emerald-400",
        };
      case "warning":
        return {
          barColor: "bg-amber-500",
          barBg: "bg-amber-500/10",
          badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          icon: <AlertTriangle className="w-4 h-4 text-amber-500 mr-1.5 flex-shrink-0" />,
          adviceColor: "text-amber-600 dark:text-amber-400",
        };
      case "danger":
      default:
        return {
          barColor: "bg-rose-500",
          barBg: "bg-rose-500/10",
          badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          icon: <AlertCircle className="w-4 h-4 text-rose-500 mr-1.5 flex-shrink-0" />,
          adviceColor: "text-rose-600 dark:text-rose-400",
        };
    }
  };

  const styling = getStatusStyling();

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Header with subject name & percentage badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {subject.subject_code && (
              <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {subject.subject_code}
              </span>
            )}
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-snug line-clamp-2">
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
            className={`px-2.5 py-1 rounded-xl text-sm font-bold border flex-shrink-0 ${styling.badgeBg}`}
          >
            {subject.percentage}%
          </div>
        </div>

        {/* Progress Bar & Class Count */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Progress</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {subject.attended} / {subject.total} classes
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${styling.barColor}`}
              style={{ width: `${Math.min(subject.percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actionable Skip / Need Status line */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center font-medium">
          {styling.icon}
          <span className={styling.adviceColor}>{metrics.message}</span>
        </div>
        <span className="text-slate-400 dark:text-slate-500 text-[11px]">85% target</span>
      </div>
    </div>
  );
};
