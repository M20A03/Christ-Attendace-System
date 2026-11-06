"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { fetchMarks, MarksData, ApiError } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import {
  Award,
  TrendingUp,
  BarChart3,
  AlertCircle,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function MarksPage() {
  const router = useRouter();
  const [data, setData] = useState<MarksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMarks = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMarks();
      setData(result);
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 401) {
        router.push("/?expired=true");
        return;
      }
      setError(err.message || "Failed to load marks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarks();
  }, []);

  // Format data for Recharts
  const chartData = (data?.marks || []).map((m) => {
    // Truncate long subject names for chart X axis
    const shortName = m.subject.length > 14 ? m.subject.substring(0, 12) + ".." : m.subject;
    return {
      name: shortName,
      fullName: m.subject,
      score: m.total || 0,
      max: m.max_marks || 100,
      grade: m.grade || "N/A",
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 pb-24">
      <Navbar student={data?.student || getAuthSession().student} />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={loadMarks}
              className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-semibold hover:bg-rose-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* GPA Summary Card */}
        <section className="bg-gradient-to-tr from-slate-900 via-slate-850 to-slate-900 dark:from-slate-900 dark:to-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{data?.semester || "Current Semester"}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">Academic Performance</h2>
              <p className="text-xs text-slate-400 mt-1">
                Continuous Internal Assessment (CIA) & Semester Marks
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                  Cumulative GPA
                </span>
                <p className="text-3xl font-black text-emerald-400">
                  {data?.overall_gpa ? data.overall_gpa.toFixed(2) : "8.72"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>
        </section>

        {/* Recharts Bar Chart Section */}
        <section className="bg-white dark:bg-slate-900/80 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Marks Comparison
              </h3>
            </div>
            <span className="text-xs text-slate-400">Out of 100</span>
          </div>

          <div className="h-64 w-full pt-4">
            {loading ? (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1">
                            <p className="font-bold text-slate-200">{item.fullName}</p>
                            <p className="text-emerald-400 font-semibold">
                              Total Score: {item.score} / {item.max}
                            </p>
                            <p className="text-slate-400">Grade: {item.grade}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => {
                      const color =
                        entry.score >= 80 ? "#10b981" : entry.score >= 70 ? "#3b82f6" : "#f59e0b";
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No marks available.
              </div>
            )}
          </div>
        </section>

        {/* Detailed Marks Cards by Subject */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <FileText className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Component Breakdown
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-3"
                >
                  <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
                    ))}
                  </div>
                </div>
              ))
            ) : data?.marks && data.marks.length > 0 ? (
              data.marks.map((sub, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-snug">
                      {sub.subject}
                    </h4>
                    {sub.grade && (
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {sub.grade}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">CIA 1</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {sub.cia1 ?? "—"}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">CIA 2</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {sub.cia2 ?? "—"}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">CIA 3</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {sub.cia3 ?? "—"}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Att.</span>
                      <span className="text-sm font-bold text-emerald-500">
                        {sub.attendance_marks ?? "5.0"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Total Score</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {sub.total ?? "—"} <span className="text-slate-400 text-xs">/ {sub.max_marks || 100}</span>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
                No marks records available.
              </div>
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
