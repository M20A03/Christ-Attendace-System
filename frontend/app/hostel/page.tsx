"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { fetchHostelAttendance, HostelBiometricInfo, HostelPunch, ApiError } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import {
  Building2,
  Fingerprint,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Lock,
  Unlock,
  KeyRound,
  FileBadge,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HostelPage() {
  const router = useRouter();
  const [data, setData] = useState<HostelBiometricInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [punchFilter, setPunchFilter] = useState<"ALL" | "IN" | "OUT">("ALL");

  const student = getAuthSession().student;

  const loadHostelData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetchHostelAttendance();
      setData(res);
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 401) {
        router.push("/?expired=true");
        return;
      }
      setError(err?.message || "Failed to load hostel biometric records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHostelData();
  }, []);

  // Demo sample data for Day Scholars who want to preview hostel features
  const sampleHostelData: HostelBiometricInfo = {
    is_hostelite: true,
    biometric_id: `BIO-${student?.reg_number || "2347101"}`,
    hostel_name: "St. Kuriakose Elias Hall (Block B)",
    room_no: "B-304",
    last_punch: "Today at 08:42 PM",
    curfew_status: "inside",
    punches: [
      {
        date: "Today",
        punch_time: "08:42 PM",
        punch_type: "IN",
        device_name: "Main Turnstile Gate #1",
        status: "Verified (On Time)",
      },
      {
        date: "Today",
        punch_time: "05:15 PM",
        punch_type: "OUT",
        device_name: "Main Turnstile Gate #2",
        status: "Evening Outing Pass",
      },
      {
        date: "Yesterday",
        punch_time: "09:18 PM",
        punch_type: "IN",
        device_name: "Main Turnstile Gate #1",
        status: "Verified (On Time)",
      },
      {
        date: "Yesterday",
        punch_time: "08:10 AM",
        punch_type: "OUT",
        device_name: "Turnstile Gate #3",
        status: "Morning Campus Exit",
      },
    ],
  };

  const activeData = previewMode ? sampleHostelData : data;
  const isResident = activeData?.is_hostelite || previewMode;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-slate-100 pb-24 selection:bg-[#0f2b5c]/10 selection:text-[#0f2b5c] dark:selection:bg-blue-500/20 dark:selection:text-blue-300 transition-colors duration-200">
      <Navbar
        student={student}
        onRefresh={() => loadHostelData(true)}
        isRefreshing={refreshing}
      />

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
              onClick={() => loadHostelData(true)}
              className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              Retry
            </motion.button>
          </div>
        )}

        {/* Hero Residency Header Card */}
        <section className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_4px_24px_rgba(15,43,92,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[#0f2b5c] dark:text-blue-400 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Christ University Halls of Residence</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Hostel Biometric Portal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Real-time gate turnstile sync and biometric entry logs
              </p>
            </div>

            {/* Status indicator badge */}
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => loadHostelData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-600 dark:text-emerald-400" : "text-emerald-600 dark:text-emerald-400"}`}
                />
                <span>{refreshing ? "Syncing Biometrics..." : "Live Gate Sync"}</span>
              </motion.button>
            </div>
          </div>
        </section>

        {/* Resident vs Day Scholar Views */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/80 h-44" />
            <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/80 h-64" />
          </div>
        ) : isResident ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Resident Overview Badge */}
            <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_4px_24px_rgba(15,43,92,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">
                      {activeData?.hostel_name || "Christ University Student Hostel"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Room: {activeData?.room_no || "Registered Room"} • Turnstile Access Active
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Turnstile Verified
                  </span>
                  {previewMode && (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800/60">
                      Sample Mode
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Biometric Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Biometric Sensor ID
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 block font-mono">
                    {activeData?.biometric_id || "BIO-VALID"}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Active & Paired</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Room Allotment
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 block font-mono">
                    {activeData?.room_no || "Registered Room"}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Campus Residence</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Last Punch
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">
                    {activeData?.last_punch || "Turnstile Logged"}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Sensor Verification</span>
                </div>
              </div>
            </div>

            {/* Biometric Turnstile Punch History */}
            <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_4px_24px_rgba(15,43,92,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-[#0f2b5c] dark:text-blue-400" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider">
                    Gate Turnstile Punch Logs
                  </h3>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  {(["ALL", "IN", "OUT"] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setPunchFilter(filter)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        punchFilter === filter
                          ? "bg-[#0f2b5c] dark:bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      {filter === "ALL" ? "All Punches" : filter === "IN" ? "Gate IN" : "Gate OUT"}
                    </button>
                  ))}
                </div>
              </div>

              {activeData?.punches && activeData.punches.length > 0 ? (
                <div className="space-y-2.5">
                  {activeData.punches
                    .filter((p) => (punchFilter === "ALL" ? true : p.punch_type === punchFilter))
                    .map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                            p.punch_type === "IN"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                              : "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                          }`}
                        >
                          {p.punch_type || "TS"}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                              {p.device_name || "Main Hostel Gate Turnstile"}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold text-slate-600 dark:text-slate-300">
                              {p.status || "Verified"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                            Turnstile Sensor ID: CU-TS-{101 + idx}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 block font-mono">
                          {p.punch_time || "Recorded"}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-medium">
                          {p.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-sm">
                  No gate punches recorded yet today.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Non-Resident / Day Scholar State */
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-3xl p-8 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_4px_24px_rgba(15,43,92,0.05)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm border border-amber-100 dark:border-amber-800/50">
              <Building2 className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200/60 dark:border-slate-700/60">
                <span>Residency Status: Day Scholar (Non-Resident)</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                You are not residing in Christ University Hostel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                The Hostel Biometric Portal is active only for students residing in campus halls of residence (such as St. Kuriakose Elias Hall, Jonas Hall, or Devadan Hall). Our university records confirm that Register Number{" "}
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{student?.reg_number || "Student"}</span> is currently registered as a Day Scholar.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setPreviewMode(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0f2b5c] dark:bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-[#163b7d] dark:hover:bg-blue-500 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View Resident Interface Demo</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span>Back to Attendance</span>
              </motion.button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
