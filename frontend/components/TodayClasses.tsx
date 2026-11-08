"use client";

import React from "react";
import { TodayClass } from "@/lib/api";
import { Clock, CheckCircle2, XCircle, Hourglass, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface TodayClassesProps {
  classes?: TodayClass[];
}

export const TodayClasses: React.FC<TodayClassesProps> = ({ classes = [] }) => {
  if (!classes || classes.length === 0) {
    return null;
  }

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "present":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Attended
          </span>
        );
      case "absent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-mono">
            <XCircle className="w-3.5 h-3.5" />
            Absent
          </span>
        );
      case "not_marked":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-mono">
            <Hourglass className="w-3.5 h-3.5" />
            Not Marked
          </span>
        );
    }
  };

  return (
    <div className="space-y-2.5">
      {classes.map((cls, idx) => (
        <motion.div
          key={idx}
          whileHover={{ y: -1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_2px_10px_rgba(15,43,92,0.02)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] flex items-center justify-between gap-3"
        >
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
              {cls.subject}
            </h4>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                {cls.time}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">{getStatusBadge(cls.status)}</div>
        </motion.div>
      ))}
    </div>
  );
};
