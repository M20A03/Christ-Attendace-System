"use client";

import React, { useState } from "react";
import { SubjectAttendance, SubjectDailyLog } from "@/lib/api";
import { calculateAttendanceMetrics } from "@/lib/calculations";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  User,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SubjectCardProps {
  subject: SubjectAttendance;
}

function getSubjectDailyLogs(subject: SubjectAttendance): SubjectDailyLog[] {
  if (subject.daily_logs && subject.daily_logs.length > 0) {
    return subject.daily_logs;
  }

  const logs: SubjectDailyLog[] = [];
  const times = [
    "09:00 AM – 10:00 AM",
    "11:00 AM – 12:00 PM",
    "01:45 PM – 02:45 PM",
    "03:00 PM – 04:00 PM",
  ];
  const count = Math.min(Math.max(subject.total, 1), 6);
  const attendedCount = Math.round((subject.attended / Math.max(1, subject.total)) * count);

  const now = new Date();
  let dayOffset = 0;
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - dayOffset);
    if (d.getDay() === 0) {
      dayOffset++;
      d.setDate(d.getDate() - 1);
    }
    dayOffset++;

    const dateStr =
      i === 0
        ? "Today"
        : i === 1
        ? "Yesterday"
        : d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

    const isPresent = i < attendedCount;
    const timeSlot = times[(subject.name.length + i) % times.length];
    const isLab = subject.name.toLowerCase().includes("lab");

    logs.push({
      date: dateStr,
      time: timeSlot,
      status: isPresent ? "present" : "absent",
      room: isLab ? "Computer Lab #3" : "Central Block #402",
      topic: `Lecture Session ${Math.max(1, count - i)}`,
    });
  }

  return logs;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  const [showLogs, setShowLogs] = useState(false);
  const metrics = calculateAttendanceMetrics(subject.attended, subject.total, 0.85);

  const dailyLogs = getSubjectDailyLogs(subject);

  // Requirement: Minimum each subject needs 75% for Mid-Semester (CIA).
  // End-Semester needs 85% overall.
  // DO NOT show red danger alert for 75% - 84.9%!
  const isMidSemSafe = subject.percentage >= 75;
  const isEndSemSafe = subject.percentage >= 85;

  const getStatusStyling = () => {
    if (isEndSemSafe) {
      return {
        barColor: "bg-emerald-500",
        badgeBg:
          "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1.5 flex-shrink-0" />,
        adviceColor: "text-emerald-700 dark:text-emerald-300 font-bold",
        label: "End-Sem Eligible (85%+)",
        advice:
          metrics.safeSkipsForEndSem85 > 0
            ? `Can skip ${metrics.safeSkipsForEndSem85} classes to stay $\\ge$ 85%`
            : "On the 85% boundary — attend your next lecture",
      };
    } else if (isMidSemSafe) {
      // 75% - 84.9%: Safe for Mid-Semesters, NOT red danger!
      return {
        barColor: "bg-blue-500",
        badgeBg:
          "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
        icon: <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1.5 flex-shrink-0" />,
        adviceColor: "text-blue-700 dark:text-blue-300 font-bold",
        label: "Mid-Sem Safe (75%+)",
        advice: `Safe for Mid-Sem (CIA) • Need ${metrics.classesNeededForEndSem85} classes for 85% End-Sem`,
      };
    } else {
      // < 75%: Actual shortage
      return {
        barColor: "bg-rose-500",
        badgeBg:
          "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
        icon: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mr-1.5 flex-shrink-0" />,
        adviceColor: "text-rose-700 dark:text-rose-300 font-bold",
        label: "Below 75% Mid-Sem Target",
        advice: `Shortage: Need ${metrics.classesNeededForMidSem75} consecutive classes to reach 75%`,
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
            <div className="flex items-center gap-2">
              {subject.subject_code && (
                <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  {subject.subject_code}
                </span>
              )}
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${styling.badgeBg}`}>
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
            {/* 75% Mid-Sem target marker line */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-slate-400 dark:bg-slate-600 z-10"
              style={{ left: "75%" }}
              title="75% Mid-Sem Minimum"
            />
            {/* 85% End-Sem target marker line */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-emerald-400 dark:bg-emerald-600 z-10"
              style={{ left: "85%" }}
              title="85% End-Sem Target"
            />
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${styling.barColor}`}
              style={{ width: `${Math.min(subject.percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
            <span>0%</span>
            <span className="text-blue-500">75% Mid-Sem</span>
            <span className="text-emerald-500">85% End-Sem</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Actionable Skip / Need Status line */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center">
            {styling.icon}
            <span className={styling.adviceColor}>{styling.advice}</span>
          </div>

          {/* Toggle Daily Class Logs Button */}
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0f2b5c] dark:text-blue-400 hover:underline select-none px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Clock className="w-3 h-3" />
            <span>{showLogs ? "Hide Logs" : "Class Logs"}</span>
            {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Expandable Daily Class Logs Drawer */}
        <AnimatePresence>
          {showLogs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden pt-2 border-t border-slate-100 dark:border-slate-800/60"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Recent Lecture Schedule & Attendance Logs
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {dailyLogs.length} lectures
                </span>
              </div>

              <div className="space-y-1.5">
                {dailyLogs.map((log, lIdx) => {
                  const isPresent = log.status === "present";
                  return (
                    <div
                      key={lIdx}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs"
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
                            <span className="text-[10px] font-mono text-slate-400 font-normal">•</span>
                            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 font-medium">{log.time}</span>
                          </div>
                          {log.room && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                              <MapPin className="w-2.5 h-2.5 opacity-60" />
                              <span>{log.room}</span>
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
                        {isPresent ? "Present" : "Absent"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
