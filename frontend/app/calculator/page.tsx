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
  Sparkles,
} from "lucide-react";

export default function CalculatorPage() {
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetPercentage, setTargetPercentage] = useState<number>(85);

  // Per-subject simulation adjustments: map subject index to { attendedAdd: number, missedAdd: number }
  const [simulations, setSimulations] = useState<Record<number, { attendedAdd: number; missedAdd: number }>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchAttendance();
        setSubjects(res.subjects);
      } catch (err) {
        // Fallback default subjects if API unreachable
        setSubjects([
          { name: "Design & Analysis of Algorithms", attended: 38, total: 42, percentage: 90.5 },
          { name: "Database Management Systems", attended: 34, total: 40, percentage: 85.0 },
          { name: "Computer Networks & Security", attended: 28, total: 36, percentage: 77.8 },
          { name: "Operating Systems & Shell Scripting", attended: 31, total: 38, percentage: 81.6 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const updateSim = (idx: number, type: "attendedAdd" | "missedAdd", delta: number) => {
    setSimulations((prev) => {
      const current = prev[idx] || { attendedAdd: 0, missedAdd: 0 };
      const nextVal = Math.max(0, current[type] + delta);
      return {
        ...prev,
        [idx]: {
          ...current,
          [type]: nextVal,
        },
      };
    });
  };

  const targetFraction = targetPercentage / 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 pb-24">
      <Navbar student={getAuthSession().student} />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header Hero banner */}
        <section className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CalcIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Attendance "What-If" Calculator
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simulate skips, plan future attendance, and meet university minimums.
              </p>
            </div>
          </div>

          {/* Interactive Target Slider */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                Target Attendance Goal
              </label>
              <div className="flex items-center gap-2">
                {[75, 85, 90].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setTargetPercentage(preset)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                      targetPercentage === preset
                        ? "bg-emerald-500 text-slate-950 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
                <span className="text-base font-black text-emerald-500 min-w-12 text-right">
                  {targetPercentage}%
                </span>
              </div>
            </div>

            <input
              type="range"
              min={60}
              max={95}
              step={1}
              value={targetPercentage}
              onChange={(e) => setTargetPercentage(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>60% (Minimum)</span>
              <span>75% (Condonation)</span>
              <span>85% (Mandatory)</span>
              <span>95% (Distinction)</span>
            </div>
          </div>
        </section>

        {/* Per-subject interactive cards */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Interactive Subject Forecasts
            </h3>
            <span className="text-xs text-slate-400 font-mono">Target: {targetPercentage}%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 animate-pulse h-48"
                />
              ))
            ) : subjects.length > 0 ? (
              subjects.map((sub, idx) => {
                const sim = simulations[idx] || { attendedAdd: 0, missedAdd: 0 };
                const projectedPercentage = simulateAttendance(
                  sub.attended,
                  sub.total,
                  sim.attendedAdd,
                  sim.missedAdd
                );
                const metrics = calculateAttendanceMetrics(
                  sub.attended + sim.attendedAdd,
                  sub.total + sim.attendedAdd + sim.missedAdd,
                  targetFraction
                );

                const isAboveTarget = projectedPercentage >= targetPercentage;

                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Subject Name & Projected Percentage */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {sub.subject_code && (
                            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 block">
                              {sub.subject_code}
                            </span>
                          )}
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2">
                            {sub.name}
                          </h4>
                          <span className="text-xs text-slate-400">
                            Current: {sub.attended}/{sub.total} ({sub.percentage}%)
                          </span>
                        </div>

                        <div
                          className={`px-3 py-1.5 rounded-xl text-center flex-shrink-0 ${
                            isAboveTarget
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          <span className="text-xs font-mono block">Projected</span>
                          <span className="text-base font-black">{projectedPercentage}%</span>
                        </div>
                      </div>

                      {/* Rule Calculation Result */}
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        {isAboveTarget ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        )}
                        <span
                          className={`text-xs font-semibold ${
                            isAboveTarget
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {metrics.message}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Simulator Steppers */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-center">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                          Attend next: +{sim.attendedAdd}
                        </span>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateSim(idx, "attendedAdd", -1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-sm w-4">{sim.attendedAdd}</span>
                          <button
                            onClick={() => updateSim(idx, "attendedAdd", 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                          Miss next: +{sim.missedAdd}
                        </span>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateSim(idx, "missedAdd", -1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-sm w-4">{sim.missedAdd}</span>
                          <button
                            onClick={() => updateSim(idx, "missedAdd", 1)}
                            className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : null}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

