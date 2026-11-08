"use client";

import React, { useState, useMemo } from "react";
import { SubjectAttendance, SubjectDailyLog, TodayClass } from "@/lib/api";
import { getSubjectLectureLogs } from "@/lib/timetable";
import {
  CheckCircle2,
  AlertCircle,
  User,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SubjectCardProps {
  subject: SubjectAttendance;
  todayClasses?: TodayClass[];
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  todayClasses = [],
}) => {
  const [showLogs, setShowLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<"all" | "attended" | "absent">("all");

  const conducted = Math.max(1, subject.total);
  const attended = Math.max(0, subject.attended);
  const missed = Math.max(0, conducted - attended);

  // Requirement: Minimum each subject needs 75% for Mid-Semester (CIA) & exam eligibility.
  // Bunk calculation must start from 75%, and NOT mention 85% in the advice message!
  const isEligible75 = subject.percentage >= 75;
  const isHigh85 = subject.percentage >= 85;

  // Safe bunks to stay at or above 75%
  const safeSkips75 = Math.max(0, Math.floor((attended * 100) / 75 - conducted));
  // Classes needed consecutively if below 75%
  const neededFor75 = subject.percentage < 75
    ? Math.ceil((75 * conducted - 100 * attended) / (100 - 75))
    : 0;

  // Clean, natural English bunk advice based strictly on 75%
  const getBunkAdvice = (): string => {
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
    if (isHigh85) {
      return {
        barColor: "bg-emerald-500",
        badgeBg:
          "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1.5 flex-shrink-0" />,
        adviceColor: "text-emerald-700 dark:text-emerald-300 font-bold",
        label: "Safe (85%+)",
      };
    } else if (isEligible75) {
      // 75% - 84.9%: Safe for Mid-Sem & Exam eligibility, NOT red danger!
      return {
        barColor: "bg-blue-500",
        badgeBg:
          "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
        icon: <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1.5 flex-shrink-0" />,
        adviceColor: "text-blue-700 dark:text-blue-300 font-bold",
        label: "Safe (75%+)",
      };
    } else {
      // < 75%: Shortage
      return {
        barColor: "bg-rose-500",
        badgeBg:
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
        icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mr-1.5 flex-shrink-0" />,
        adviceColor: "text-rose-700 dark:text-rose-300 font-bold",
        label: "Below 75%",
      };
    }
  };

  const styling = getStatusStyling();

  // Find genuine today's classes matching this subject (if today has one)
  const normSubName = subject.name.trim().toLowerCase();
  const normSubCode = (subject.subject_code || "").trim().toLowerCase();
  const matchingTodayClasses = todayClasses.filter((c) => {
    const normCls = c.subject.trim().toLowerCase();
    return (
      normSubName.includes(normCls) ||
      normCls.includes(normSubName) ||
      (normSubCode && (normCls.includes(normSubCode) || normSubCode.includes(normCls)))
    );
  });

  // Authentic date display
  const todayFormatted = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  // Generate date-wise class sessions for this subject
  const allLectureLogs: SubjectDailyLog[] = useMemo(() => {
    return getSubjectLectureLogs(subject);
  }, [subject]);

  // Filter logs based on student choice: all vs only attended vs only absent
  const filteredLogs = useMemo(() => {
    if (logFilter === "attended") {
      return allLectureLogs.filter((l) => l.status === "present");
    }
    if (logFilter === "absent") {
      return allLectureLogs.filter((l) => l.status === "absent");
    }
    return allLectureLogs;
  }, [allLectureLogs, logFilter]);

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
            <div className="flex items-center gap-2">
              {subject.subject_code && (
                <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  {subject.subject_code}
                </span>
              )}
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${styling.badgeBg}`}>
                {styling.label}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 mt-0.5">
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
              style={{ width: `${Math.min(subject.percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
            <span>0%</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">75% Target</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">85% Target</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Actionable Skip / Need Status line */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center pr-2">
            {styling.icon}
            <span className={styling.adviceColor}>{adviceText}</span>
          </div>

          {/* Toggle Daily Class Logs Button */}
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0f2b5c] dark:text-blue-400 hover:underline select-none px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <Clock className="w-3 h-3" />
            <span>{showLogs ? "Hide Logs" : "Class Logs"}</span>
            {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Expandable Daily Class Logs & Attendance Register */}
        <AnimatePresence>
          {showLogs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-3"
            >
              {/* Official Course Register Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/70 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-[#0f2b5c] dark:text-blue-400" />
                    Course Attendance Summary
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    Live Portal Sync
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Conducted</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">
                      {conducted}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">Attended</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono text-sm">
                      {attended}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] text-rose-500 block font-medium">Missed</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-sm">
                      {missed}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Safe bunks to keep 75%:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    {safeSkips75} {safeSkips75 === 1 ? "class" : "classes"}
                  </span>
                </div>
              </div>

              {/* Today's Scheduled Class (if today has one) */}
              {matchingTodayClasses.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Today's Session ({todayFormatted})
                  </span>
                  {matchingTodayClasses.map((cls, cIdx) => (
                    <div
                      key={cIdx}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#0f2b5c] dark:text-blue-400" />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {todayFormatted}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {cls.time || "Scheduled Lecture"}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                          cls.status === "present"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                            : cls.status === "absent"
                            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40"
                            : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40"
                        }`}
                      >
                        {cls.status === "present" ? "Attended" : cls.status === "absent" ? "Absent" : "Scheduled"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Day-by-Day Historical Class Logs with Attended/Absent Filters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Daily Class Logs
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {filteredLogs.length} of {allLectureLogs.length} classes
                  </span>
                </div>

                {/* Filter Selector: All vs Only Attended vs Only Absent */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setLogFilter("all")}
                    className={`flex-1 py-1 px-2 rounded-lg text-center transition-all text-[11px] ${
                      logFilter === "all"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    All ({allLectureLogs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter("attended")}
                    className={`flex-1 py-1 px-2 rounded-lg text-center transition-all text-[11px] ${
                      logFilter === "attended"
                        ? "bg-emerald-600 text-white shadow-2xs font-bold"
                        : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    }`}
                  >
                    Attended ({attended})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter("absent")}
                    className={`flex-1 py-1 px-2 rounded-lg text-center transition-all text-[11px] ${
                      logFilter === "absent"
                        ? "bg-rose-600 text-white shadow-2xs font-bold"
                        : "text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    }`}
                  >
                    Absent ({missed})
                  </button>
                </div>

                {/* Class Session Items */}
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log, lIdx) => {
                      const isPresent = log.status === "present";
                      return (
                        <div
                          key={lIdx}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                isPresent
                                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                                  : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                              }`}
                            >
                              {isPresent ? "P" : "A"}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
                                <span>{log.date}</span>
                                {log.time && (
                                  <>
                                    <span className="text-[10px] font-mono text-slate-400 font-normal">•</span>
                                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                                      {log.time}
                                    </span>
                                  </>
                                )}
                              </div>
                              {log.topic && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]">
                                  {log.topic}
                                </div>
                              )}
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                              isPresent
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40"
                            }`}
                          >
                            {isPresent ? "Attended" : "Absent"}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center">
                      No {logFilter === "attended" ? "attended" : logFilter === "absent" ? "absent" : ""} classes in this filter.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
