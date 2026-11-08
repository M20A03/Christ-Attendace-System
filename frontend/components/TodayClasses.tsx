"use client";

import React, { useState, useMemo } from "react";
import { TodayClass, SubjectAttendance } from "@/lib/api";
import {
  generateWeeklyTimetable,
  DayOfWeek,
  WEEKDAYS,
  ScheduledClass,
} from "@/lib/timetable";
import { Clock, Calendar, CheckCircle2, XCircle, Hourglass, BookOpen, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TodayClassesProps {
  classes?: TodayClass[];
  subjects?: SubjectAttendance[];
}

export const TodayClasses: React.FC<TodayClassesProps> = ({ classes = [], subjects = [] }) => {
  // Determine current day of week
  const todayActual = useMemo(() => {
    return new Date().toLocaleDateString("en-US", { weekday: "long" }) as DayOfWeek | "Sunday";
  }, []);

  // Default to today if Monday-Saturday, or Monday if Sunday
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() => {
    if (todayActual === "Sunday" || !WEEKDAYS.includes(todayActual as DayOfWeek)) {
      return "Monday";
    }
    return todayActual as DayOfWeek;
  });

  // Generate full weekly schedule from student's enrolled courses and today's classes
  const weeklySchedule = useMemo(() => {
    return generateWeeklyTimetable(subjects, classes);
  }, [subjects, classes]);

  const currentDayClasses: ScheduledClass[] = weeklySchedule[selectedDay] || [];

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "present":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-mono">
            <CheckCircle2 className="w-3 h-3" />
            Present
          </span>
        );
      case "absent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-mono">
            <XCircle className="w-3 h-3" />
            Absent
          </span>
        );
      case "not_marked":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-mono">
            <Hourglass className="w-3 h-3" />
            Not Marked
          </span>
        );
      case "scheduled":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 font-mono">
            Scheduled
          </span>
        );
    }
  };

  const dayShortMap: Record<DayOfWeek, string> = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
  };

  return (
    <div className="space-y-3">
      {/* Interactive Day-of-Week Selector Tabs */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs w-full justify-between">
          {WEEKDAYS.map((day) => {
            const isSelected = selectedDay === day;
            const isToday = todayActual === day;
            const classCount = weeklySchedule[day]?.length || 0;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`relative flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center min-w-[50px] ${
                  isSelected
                    ? "bg-[#0f2b5c] text-white shadow-sm dark:bg-blue-600"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <span className="text-[11px] uppercase tracking-wider">{dayShortMap[day]}</span>
                <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? "text-white/80" : "text-slate-400 dark:text-slate-500"}`}>
                  {classCount} {classCount === 1 ? "class" : "classes"}
                </span>

                {isToday && (
                  <span
                    className={`absolute -top-1 right-1 w-2 h-2 rounded-full ${
                      isSelected ? "bg-emerald-400 ring-2 ring-white dark:ring-slate-900" : "bg-emerald-500"
                    }`}
                    title="Today"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Header Notice */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#0f2b5c] dark:text-blue-400" />
          <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDay} Schedule</span>
          {todayActual === selectedDay ? (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              Today
            </span>
          ) : todayActual === "Sunday" ? (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
              (Sunday is Holiday)
            </span>
          ) : null}
        </span>
        <span className="text-[11px] font-mono text-slate-400">
          {currentDayClasses.length} {currentDayClasses.length === 1 ? "lecture" : "lectures"}
        </span>
      </div>

      {/* Classes List for Selected Day */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="space-y-2.5"
        >
          {currentDayClasses.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800/80 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400 dark:text-slate-500">
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No classes scheduled on {selectedDay}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Enjoy your preparation or free time!
              </p>
            </div>
          ) : (
            currentDayClasses.map((cls, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_2px_10px_rgba(15,43,92,0.02)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#0f2b5c] dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40">
                      Period {cls.periodNumber}
                    </span>
                    {cls.subjectCode && (
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        {cls.subjectCode}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate mt-1">
                    {cls.subject}
                  </h4>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {cls.time}
                    </span>
                    {cls.faculty && (
                      <span className="flex items-center gap-1 truncate text-[11px]">
                        <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span className="truncate">{cls.faculty}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {getStatusBadge(todayActual === selectedDay ? cls.status : "scheduled")}
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
