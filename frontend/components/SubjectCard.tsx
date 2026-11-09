"use client";

import React from "react";
import { SubjectAttendance } from "@/lib/api";
import {
  CheckCircle2,
  AlertCircle,
  User,
} from "lucide-react";
import { motion } from "framer-motion";

interface SubjectCardProps {
  subject: SubjectAttendance;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  const conducted = Math.max(0, subject.total);
  const attended = Math.max(0, subject.attended);

  // If 0 classes conducted, there is no shortage or bunk requirement
  const isZeroConducted = conducted === 0;

  // Requirement: Minimum each subject needs 75% for Mid-Semester (CIA) & exam eligibility.
  const isEligible75 = !isZeroConducted && subject.percentage >= 75;
  const isHigh85 = !isZeroConducted && subject.percentage >= 85;

  // Safe bunks to stay at or above 75%
  const safeSkips75 = isZeroConducted
    ? 0
    : Math.max(0, Math.floor((attended * 100) / 75 - conducted));

  // Classes needed consecutively if below 75%
  const neededFor75 = isZeroConducted || subject.percentage >= 75
    ? 0
    : Math.ceil((75 * conducted - 100 * attended) / (100 - 75));

  // Clean, natural English bunk advice based strictly on 75%
  const getBunkAdvice = (): string => {
    if (isZeroConducted) {
      return "No classes conducted yet — no shortage";
    }
    if (isEligible75) {
      if (safeSkips75 > 0) {
        return `Can safely bunk ${safeSkips75} ${safeSkips75 === 1 ? "class" : "classes"} (stays above 75%)`;
      }
      return "On the 75% cutoff — attend your next class";
    }
    return `Shortage: Need ${neededFor75} consecutive ${neededFor75 === 1 ? "class" : "classes"} to reach 75%`;
  };

  const adviceText = getBunkAdvice();

  // Status styling
  const getStatusStyling = () => {
    if (isZeroConducted) {
      return {
        barColor: "bg-slate-300 dark:bg-slate-700",
        badgeBg:
          "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        icon: <CheckCircle2 className="w-4 h-4 text-slate-500 mr-1.5 flex-shrink-0" />,
        adviceColor: "text-slate-600 dark:text-slate-400 font-medium",
        cardBorder: "border-l-4 border-l-slate-300 dark:border-l-slate-700",
        label: "Not Started",
      };
    }
    if (isHigh85) {
      return {
        barColor: "bg-emerald-500",
        badgeBg:
          "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1.5 flex-shrink-0" />,
        adviceColor: "text-emerald-700 dark:text-emerald-300 font-bold",
        cardBorder: "border-l-4 border-l-emerald-500",
        label: "Safe (85%+)",
      };
    } else if (isEligible75) {
      return {
        barColor: "bg-blue-600",
        badgeBg:
          "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
        icon: <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1.5 flex-shrink-0" />,
        adviceColor: "text-blue-700 dark:text-blue-300 font-bold",
        cardBorder: "border-l-4 border-l-blue-500",
        label: "Eligible (75%+)",
      };
    } else {
      return {
        barColor: "bg-rose-500",
        badgeBg:
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
        icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mr-1.5 flex-shrink-0" />,
        adviceColor: "text-rose-700 dark:text-rose-300 font-bold",
        cardBorder: "border-l-4 border-l-rose-500",
        label: "Below 75%",
      };
    }
  };

  const styling = getStatusStyling();

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.004 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(15,43,92,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:shadow-md transition-all flex flex-col justify-between ${styling.cardBorder}`}
    >
      <div>
        {/* Header with subject name & percentage badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {subject.subject_code && (
                <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  {subject.subject_code}
                </span>
              )}
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border ${styling.badgeBg}`}>
                {styling.label}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 mt-1">
              {subject.name}
            </h3>
            {subject.faculty && (
              <p className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                <User className="w-3 h-3 mr-1 opacity-70 flex-shrink-0" />
                <span className="truncate">{subject.faculty}</span>
              </p>
            )}
          </div>

          <div
            className={`px-2.5 py-1 rounded-xl text-xs font-black border flex-shrink-0 font-mono shadow-2xs ${styling.badgeBg}`}
          >
            {isZeroConducted ? "0%" : `${subject.percentage}%`}
          </div>
        </div>

        {/* Progress Bar & Class Count */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>Conducted vs Attended</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              {attended} / {conducted} classes
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
            {/* 75% Minimum Target Marker */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-blue-500/80 z-10"
              style={{ left: "75%" }}
              title="75% Minimum Target"
            />
            {/* 85% Target Marker */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-emerald-500/80 z-10"
              style={{ left: "85%" }}
              title="85% Target"
            />
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${styling.barColor}`}
              style={{ width: `${isZeroConducted ? 0 : Math.min(subject.percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-mono">
            <span>0%</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">75% Mid-Sem</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">85% End-Sem</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Actionable Skip / Need Status line */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center text-xs p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/60">
          {styling.icon}
          <span className={styling.adviceColor}>{adviceText}</span>
        </div>
      </div>
    </motion.div>
  );
};
