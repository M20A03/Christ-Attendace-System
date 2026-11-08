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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 selection:bg-[#0f2b5c]/10 selection:text-[#0f2b5c]">
      <Navbar
        student={student}
        onRefresh={() => loadHostelData(true)}
        isRefreshing={refreshing}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
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
        <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,43,92,0.05)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[#0f2b5c] text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Christ University Halls of Residence</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Hostel Biometric Portal
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Real-time gate turnstile sync, curfew timer, and biometric entry audit
              </p>
            </div>

            {/* Status indicator badge */}
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => loadHostelData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-600" : "text-emerald-600"}`}
                />
                <span>{refreshing ? "Syncing Biometrics..." : "Live Gate Sync"}</span>
              </motion.button>
            </div>
          </div>
        </section>

        {/* Resident vs Day Scholar Views */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 h-44" />
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 h-64" />
          </div>
        ) : isResident ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Resident Overview Badge */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,43,92,0.05)] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-100">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      {activeData?.hostel_name || "Christ University Student Hostel"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Room: {activeData?.room_no || "Registered Room"} • Turnstile Access Active
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Turnstile Verified
                  </span>
                  {previewMode && (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                      Sample Mode
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Biometric ID
                  </span>
                  <span className="text-sm font-black text-slate-900 mt-1 block font-mono">
                    {activeData?.biometric_id || "BIO-VALID"}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Active & Paired</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Current Status
                  </span>
                  <span className="text-sm font-black text-emerald-700 mt-1 block">
                    Inside Hostel
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Turnstile Safe</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Last Gate Punch
                  </span>
                  <span className="text-xs font-black text-slate-900 mt-1.5 block truncate">
                    {activeData?.last_punch || "Recent Entry"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Turnstile 1</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Curfew Deadline
                  </span>
                  <span className="text-sm font-black text-slate-900 mt-1 block">
                    09:30 PM
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Lockdown Time</span>
                </div>
              </div>
            </div>

            {/* Official Christ Curfew & Gate Rules */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,43,92,0.05)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0f2b5c]" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Official Christ University Gate & Curfew Regulations
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  Turnstiles Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Morning Gate Open</span>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-xl font-black text-slate-900">06:00 AM</p>
                  <p className="text-[11px] text-slate-500">Biometric turnstiles unlocked for morning campus entry</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Evening Curfew</span>
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <p className="text-xl font-black text-rose-700">09:30 PM</p>
                  <p className="text-[11px] text-slate-500">Mandatory biometric punch. Late entries flagged to Warden</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Library Pass</span>
                    <KeyRound className="w-3.5 h-3.5 text-[#0f2b5c]" />
                  </div>
                  <p className="text-xl font-black text-[#0f2b5c]">10:30 PM</p>
                  <p className="text-[11px] text-slate-500">Extended hours for library revision with active digital pass</p>
                </div>
              </div>
            </div>

            {/* Biometric Gate Turnstile Punches */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,43,92,0.05)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileBadge className="w-4 h-4 text-[#0f2b5c]" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Biometric Turnstile Punch History
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {activeData?.punches?.length || 0} Punches Recorded
                </span>
              </div>

              {activeData?.punches && activeData.punches.length > 0 ? (
                <div className="space-y-2.5">
                  {activeData.punches.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            p.punch_type === "IN"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {p.punch_type || "IN"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                              {p.device_name || "Main Hostel Gate Turnstile"}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 font-semibold text-slate-600">
                              {p.status || "Verified"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Turnstile Sensor ID: CU-TS-{101 + idx}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 block font-mono">
                          {p.punch_time || "Recorded"}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {p.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-sm">
                  No gate punches recorded yet today.
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Day Scholar Fallback State */
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,43,92,0.05)] text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto shadow-sm">
              <Building2 className="w-8 h-8 text-[#0f2b5c]" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                Day Scholar Account
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                No active hostel residency is currently registered on Christ University KPService for Reg No.{" "}
                <span className="font-mono font-bold text-slate-700">{student?.reg_number || "Student"}</span>.
                Biometric turnstile access activates automatically once room allocation is assigned by the Hostel Office.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setPreviewMode(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0f2b5c] text-white text-xs font-bold shadow-sm hover:bg-[#163b7d] transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Hostel Resident Features</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                <span>Back to Dashboard</span>
              </motion.button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
