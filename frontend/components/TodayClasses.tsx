"use client";

import React from "react";
import { TodayClass } from "@/lib/api";
import { Clock, MapPin, CheckCircle2, XCircle, Hourglass, Calendar } from "lucide-react";

interface TodayClassesProps {
  classes: TodayClass[];
}

export const TodayClasses: React.FC<TodayClassesProps> = ({ classes }) => {
  if (!classes || classes.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
          <Calendar className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No classes scheduled today</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Enjoy your day off or revision time!</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Present
          </span>
        );
      case "absent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Absent
          </span>
        );
      case "not_marked":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Hourglass className="w-3.5 h-3.5" />
            Not Marked
          </span>
        );
    }
  };

  return (
    <div className="space-y-2.5">
      {classes.map((cls, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3"
        >
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
              {cls.subject}
            </h4>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {cls.time}
              </span>
              {cls.room && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {cls.room}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">{getStatusBadge(cls.status)}</div>
        </div>
      ))}
    </div>
  );
};

