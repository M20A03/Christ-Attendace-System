"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { fetchAttendance, SubjectAttendance } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import {
  calculateAttendanceMetrics,
  simulateAttendance,
} from "@/lib/calculations";
import {
  Calculator as CalcIcon,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
  Minus,
  BookOpen,
  Calendar,
  Target,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { motion } from "framer-motion";

export default function CalculatorPage() {
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState<string>("overall");

  const [conducted, setConducted] = useState<number>(60);
  const [attended, setAttended] = useState<number>(51);
  const [blueFormHours, setBlueFormHours] = useState<number>(0);
  const [yellowFormHours, setYellowFormHours] = useState<number>(0);
  const [targetPercentage, setTargetPercentage] = useState<number>(85);

  // Simulation controls
  const [simExtraAttended, setSimExtraAttended] = useState<number>(0);
  const [simExtraMissed, setSimExtraMissed] = useState<number>(0);

  // Load real subjects on mount
  useEffect(() => {
    async function loadSubjects() {
      try {
        const attData = await fetchAttendance();
        if (attData.subjects && attData.subjects.length > 0) {
          setSubjects(attData.subjects);
          const totalConducted = attData.subjects.reduce((sum, s) => sum + s.total, 0);
          const totalAttended = attData.subjects.reduce((sum, s) => sum + s.attended, 0);
          if (totalConducted > 0) {
            setConducted(totalConducted);
            setAttended(totalAttended);
          }
        }
      } catch (err) {
        setConducted(60);
        setAttended(52);
      } finally {
        setLoadingSubjects(false);
      }
    }
    loadSubjects();
  }, []);

  const handleSubjectSelect = (idxStr: string) => {
    if (idxStr === "overall") {
      setSelectedSubjectIdx("overall");
      const totalConducted = subjects.reduce((sum, s) => sum + s.total, 0);
      const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
      setConducted(totalConducted || 60);
      setAttended(totalAttended || 51);
    } else {
      setSelectedSubjectIdx(idxStr);
      const idx = Number(idxStr);
      const sub = subjects[idx];
      if (sub) {
        setConducted(sub.total);
        setAttended(sub.attended);
      }
    }
    setSimExtraAttended(0);
    setSimExtraMissed(0);
  };

  // Compute attendance metrics with Blue/Yellow forms
  const targetFraction = targetPercentage / 100;
  const metrics = calculateAttendanceMetrics(
    attended,
    conducted,
    targetFraction,
    blueFormHours,
    yellowFormHours
  );

  // Simulated projected percentage
  const projectedPercentage = simulateAttendance(
    attended,
    conducted,
    simExtraAttended,
    simExtraMissed,
    blueFormHours,
    yellowFormHours
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-slate-100 pb-24 selection:bg-[#0f2b5c]/10 selection:text-[#0f2b5c] dark:selection:bg-blue-500/20 dark:selection:text-blue-300 transition-colors duration-200">
      <Navbar student={getAuthSession().student} />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Safe Skips & Attendance Calculator
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulate safe bunks, needed classes, and medical/duty leaves to maintain your Christ University target.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick-load from student enrolled subjects */}
          {subjects.length > 0 && (
            <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(15,43,92,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Sync from Enrolled Subject
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Select a subject to automatically load your actual attended & conducted hours
                  </span>
                </div>
              </div>

              <select
                value={selectedSubjectIdx}
                onChange={(e) => handleSubjectSelect(e.target.value)}
                className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] dark:focus:ring-blue-500"
              >
                <option value="overall">All Subjects Combined (Overall)</option>
                {subjects.map((sub, idx) => (
                  <option key={sub.subject_code || idx} value={String(idx)}>
                    {sub.name} ({sub.attended}/{sub.total} • {sub.percentage}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Outcome Prediction Hero Card */}
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_4px_24px_rgba(15,43,92,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    metrics.status === "safe"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50"
                      : metrics.status === "warning"
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50"
                  }`}
                >
                  {metrics.status === "safe" ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : metrics.status === "warning" ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Target: {targetPercentage}% Attendance
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        metrics.status === "safe"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                          : metrics.status === "warning"
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                          : "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                      }`}
                    >
                      {metrics.status === "safe"
                        ? "Safe Margin"
                        : metrics.status === "warning"
                        ? "Borderline"
                        : "Critical"}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                    {metrics.percentage}% Current Attendance
                  </h2>
                </div>
              </div>

              {/* Safe skips or needed banner */}
              <div className="text-left sm:text-right bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  {metrics.safeSkips > 0 ? "Safe Skips Left" : "Classes Needed"}
                </span>
                <span
                  className={`text-2xl font-black block font-mono ${
                    metrics.safeSkips > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {metrics.safeSkips > 0
                    ? `${metrics.safeSkips} classes`
                    : `${metrics.classesNeeded} consecutive`}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  {metrics.safeSkips > 0
                    ? `Can miss without dropping below ${targetPercentage}%`
                    : `Must attend continuously to reach ${targetPercentage}%`}
                </span>
              </div>
            </div>

            {/* Attendance inputs & sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Classes Attended */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <label htmlFor="attended-input" className="text-slate-700 dark:text-slate-300">
                    Classes Attended
                  </label>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-extrabold text-sm">
                    {attended}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setAttended((prev) => Math.max(0, prev - 1))}
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-base hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <input
                    id="attended-input"
                    type="range"
                    min="0"
                    max={Math.max(100, conducted)}
                    value={attended}
                    onChange={(e) => setAttended(Number(e.target.value))}
                    className="w-full accent-[#0f2b5c] dark:accent-blue-500 cursor-pointer"
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setAttended((prev) => prev + 1)}
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-base hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Total Conducted */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <label htmlFor="conducted-input" className="text-slate-700 dark:text-slate-300">
                    Total Classes Conducted
                  </label>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-extrabold text-sm">
                    {conducted}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setConducted((prev) => Math.max(1, prev - 1))}
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-base hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <input
                    id="conducted-input"
                    type="range"
                    min="1"
                    max="150"
                    value={conducted}
                    onChange={(e) => setConducted(Number(e.target.value))}
                    className="w-full accent-[#0f2b5c] dark:accent-blue-500 cursor-pointer"
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setConducted((prev) => prev + 1)}
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-base hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Medical (Blue Form) and Duty Leave (Yellow Form) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#0f2b5c] dark:text-blue-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Official Christ Leave Adjustments
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Approved Forms
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <p>
                  • <strong className="text-blue-700 dark:text-blue-400">Blue Form (Medical Leave):</strong> Hospitalization or serious illness verified by Campus Health Clinic (deducted from total conducted).
                </p>
                <p>
                  • <strong className="text-amber-700 dark:text-amber-400">Yellow Form (Duty Leave):</strong> Co-curricular representation, fests, sports, or hackathons credited directly into attendance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-blue-900 dark:text-blue-300">
                    <span>Blue Form (Medical)</span>
                    <span className="font-mono">{blueFormHours} hrs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBlueFormHours((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={blueFormHours}
                      onChange={(e) => setBlueFormHours(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <button
                      onClick={() => setBlueFormHours((prev) => prev + 1)}
                      className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-900 dark:text-amber-300">
                    <span>Yellow Form (Duty Leave)</span>
                    <span className="font-mono">{yellowFormHours} hrs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setYellowFormHours((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={yellowFormHours}
                      onChange={(e) => setYellowFormHours(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <button
                      onClick={() => setYellowFormHours((prev) => prev + 1)}
                      className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Percentage Selection Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Target Attendance Goal:
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {[75, 85, 90].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetPercentage(preset)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      targetPercentage === preset
                        ? "bg-[#0f2b5c] dark:bg-blue-600 text-white border-[#0f2b5c] dark:border-blue-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {preset}% {preset === 75 ? "(Minimum)" : preset === 85 ? "(Recommended)" : "(Excellence)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Controls: What-If Future Classes */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Future Classes Simulator
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    See how attending or missing future hours alters your percentage
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                    {projectedPercentage}%
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">
                    Projected
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="flex-1 w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700/60 shadow-xs">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Attend next classes: +{simExtraAttended}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSimExtraAttended((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600"
                    >
                      -
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSimExtraAttended((prev) => prev + 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600"
                    >
                      +
                    </motion.button>
                  </div>
                </div>

                <div className="flex-1 w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700/60 shadow-xs">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                    Miss next classes: +{simExtraMissed}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSimExtraMissed((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600"
                    >
                      -
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSimExtraMissed((prev) => prev + 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600"
                    >
                      +
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
