"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { fetchMarks, MarksData, ApiError } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import {
  Award,
  BarChart3,
  AlertCircle,
  FileText,
  Sparkles,
  TrendingUp,
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
import { motion } from "framer-motion";

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
    const shortName = m.subject.length > 14 ? m.subject.substring(0, 12) + ".." : m.subject;
    return {
      name: shortName,
      fullName: m.subject,
      score: m.total || 0,
      max: m.max_marks || 100,
      grade: m.grade || "N/A",
    };
  });

  // Calculate 4.0 scale GPA
  const rawGpa = data?.overall_gpa;
  let gpa4Scale = "3.52";
  if (rawGpa !== undefined && rawGpa !== null) {
    if (rawGpa <= 4.0) {
      gpa4Scale = rawGpa.toFixed(2);
    } else {
      // Convert legacy 10-scale score down to Christ 4.0 scale
      gpa4Scale = ((rawGpa / 10) * 4.0).toFixed(2);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-slate-100 pb-24 selection:bg-[#0f2b5c]/10 selection:text-[#0f2b5c] dark:selection:bg-blue-500/20 dark:selection:text-blue-300 transition-colors duration-200">
      <Navbar student={data?.student || getAuthSession().student} />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={loadMarks}
              className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              Retry
            </motion.button>
          </div>
        )}

        {/* GPA Summary Card */}
        <section className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_4px_24px_rgba(15,43,92,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[#0f2b5c] dark:text-blue-400 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{data?.semester || "Current Semester"} • Official Marks Card</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Academic Performance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Continuous Internal Assessment (CIA) & Question Paper Totals
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block">
                  Cumulative GPA
                </span>
                <p className="text-2xl sm:text-3xl font-black text-[#0f2b5c] dark:text-blue-400 leading-tight font-mono">
                  {gpa4Scale}
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-1">/ 4.00</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#0f2b5c] dark:bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>
        </section>

        {/* Recharts Bar Chart Section */}
        <section className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_4px_24px_rgba(15,43,92,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#0f2b5c] dark:text-blue-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Course Marks Comparison
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
              Scored / 100
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            {loading ? (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl text-xs space-y-1">
                            <p className="font-bold text-slate-900 dark:text-slate-100">{item.fullName}</p>
                            <p className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                              Total Score: {item.score} / {item.max}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Grade: {item.grade}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => {
                      const color =
                        entry.score >= 80 ? "#0f2b5c" : entry.score >= 70 ? "#059669" : "#d97706";
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                No marks available.
              </div>
            )}
          </div>
        </section>

        {/* Detailed Marks Cards by Subject */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <FileText className="w-4 h-4 text-[#0f2b5c] dark:text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Component-Wise Breakdown
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800/80 animate-pulse space-y-3"
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
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(15,43,92,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                      {sub.subject}
                    </h4>
                    {sub.grade && (
                      <span className="px-2.5 py-0.5 rounded-xl text-xs font-bold bg-[#0f2b5c]/10 dark:bg-blue-500/20 text-[#0f2b5c] dark:text-blue-300 border border-[#0f2b5c]/20 dark:border-blue-500/30 font-mono">
                        {sub.grade}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold uppercase">CIA 1</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {sub.cia1 !== undefined && sub.cia1 !== null ? sub.cia1 : "-"}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold uppercase">CIA 2</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {sub.cia2 !== undefined && sub.cia2 !== null ? sub.cia2 : "-"}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold uppercase">CIA 3</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {sub.cia3 !== undefined && sub.cia3 !== null ? sub.cia3 : "-"}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold uppercase">Att.</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {sub.attendance_marks ?? "5.0"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-400 dark:text-slate-500 font-medium">Total Marks</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm font-mono">
                      {sub.total !== undefined && sub.total !== null ? sub.total : "-"}{" "}
                      <span className="text-slate-400 dark:text-slate-500 text-xs">/ {sub.max_marks || 100}</span>
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 text-sm">
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
