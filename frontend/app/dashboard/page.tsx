"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { AttendanceRing } from "@/components/AttendanceRing";
import { SubjectCard } from "@/components/SubjectCard";
import { TodayClasses } from "@/components/TodayClasses";
import { SkeletonHeroRing, SkeletonSubjectCard, SkeletonList } from "@/components/SkeletonLoader";
import { fetchAttendance, fetchHostelAttendance, AttendanceData, HostelBiometricInfo, ApiError } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { RefreshCw, Clock, AlertCircle, Calendar, BookOpen, Building2, Fingerprint, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [hostelData, setHostelData] = useState<HostelBiometricInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const lastSyncTimeRef = useRef<number>(Date.now());

  const loadAttendance = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [attResult, bioResult] = await Promise.all([
        fetchAttendance(isRefresh),
        fetchHostelAttendance().catch(() => ({ is_hostelite: false })),
      ]);
      if (attResult.subjects && attResult.subjects.length > 0) {
        setData(attResult);
      } else {
        setData((prev) => (prev && prev.subjects && prev.subjects.length > 0 ? prev : attResult));
      }
      setHostelData(bioResult);
      setSecondsAgo(0);
      lastSyncTimeRef.current = Date.now();
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 401) {
        router.push("/?expired=true");
        return;
      }
      setError(err.message || "Failed to load attendance records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Gentle auto-refresh when student returns to app, safely throttled to max once every 3 minutes.
  // Prevents spamming university servers with unnecessary requests while keeping records fresh.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const timeSinceLastSync = Date.now() - lastSyncTimeRef.current;
        if (timeSinceLastSync > 180000) {
          loadAttendance(true);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loadAttendance]);

  // Timer for "Last updated: X seconds ago"
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatSecondsAgo = (secs: number) => {
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    return `${mins}m ago`;
  };

  // Compute total attended and total conducted classes across subjects
  const totals = data?.subjects.reduce(
    (acc, curr) => ({
      attended: acc.attended + curr.attended,
      total: acc.total + curr.total,
    }),
    { attended: 0, total: 0 }
  ) || { attended: 0, total: 0 };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-slate-100 pb-24 selection:bg-[#0f2b5c]/10 selection:text-[#0f2b5c] dark:selection:bg-blue-500/20 dark:selection:text-blue-300 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        student={data?.student || getAuthSession().student}
        onRefresh={() => loadAttendance(true)}
        isRefreshing={refreshing}
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              <p className="text-xs sm:text-sm font-medium">{error}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => loadAttendance(true)}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors flex-shrink-0"
            >
              Retry
            </motion.button>
          </div>
        )}

        {/* Hero Section: Attendance Ring + Last Updated Badge */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Attendance Status
              </h2>
            </div>

            {/* Live refresh action badge */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => loadAttendance(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
              title="Fetch latest live attendance marked by teachers"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-600 dark:text-emerald-400" : "text-emerald-600 dark:text-emerald-400"}`}
              />
              <span>{refreshing ? "Refreshing..." : `Live • ${formatSecondsAgo(secondsAgo)}`}</span>
            </motion.button>
          </div>

          {loading ? (
            <SkeletonHeroRing />
          ) : data ? (
            <AttendanceRing
              percentage={data.overall_attendance}
              attended={totals.attended}
              total={totals.total}
            />
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 text-sm">
              No attendance data yet. Tap refresh to fetch your latest records.
            </div>
          )}
        </section>

        {/* Today's Classes Section (Shown ONLY when real classes are scheduled for today) */}
        {data?.today_classes && data.today_classes.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0f2b5c] dark:text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Today's Schedule
                </h3>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-medium">
                {data.today_classes.length} {data.today_classes.length === 1 ? "class" : "classes"}
              </span>
            </div>
            <TodayClasses classes={data.today_classes} />
          </section>
        )}

        {/* Subject Cards Grid Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#0f2b5c] dark:text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Courses Breakdown
              </h3>
            </div>
            {data?.subjects && (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-medium">
                {data.subjects.length} Subjects
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonSubjectCard key={i} />
              ))}
            </div>
          ) : data?.subjects && data.subjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.subjects.map((sub, idx) => (
                <SubjectCard
                  key={idx}
                  subject={sub}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 text-sm">
              No course subjects found.
            </div>
          )}
        </section>

        {/* Hostel Biometric Attendance (Visible ONLY for Real Verified Hostel Residents) */}
        {hostelData?.is_hostelite && hostelData.biometric_id && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0f2b5c] dark:text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Hostel Biometric Attendance
                </h3>
              </div>
              {hostelData.biometric_id && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-700/60">
                  ID: {hostelData.biometric_id}
                </span>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(15,43,92,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/40">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {hostelData.hostel_name || "Christ University Hostel"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Biometric Access Card Registered
                    </p>
                  </div>
                </div>

                {hostelData.last_punch && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold block">
                      Last Punch
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {hostelData.last_punch}
                    </span>
                  </div>
                )}
              </div>

              {hostelData.punches && hostelData.punches.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Recent Gate Punches
                  </span>
                  <div className="space-y-1.5">
                    {hostelData.punches.slice(0, 3).map((punch, lIdx) => (
                      <div
                        key={lIdx}
                        className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50"
                      >
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {punch.punch_type || "Turnstile Punch"}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {punch.punch_time || punch.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                <Link
                  href="/hostel"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f2b5c] dark:text-blue-400 hover:underline"
                >
                  <span>Open Dedicated Hostel Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
