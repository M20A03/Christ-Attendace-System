"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { AttendanceRing } from "@/components/AttendanceRing";
import { SubjectCard } from "@/components/SubjectCard";
import { TodayClasses } from "@/components/TodayClasses";
import { SkeletonHeroRing, SkeletonSubjectCard, SkeletonList } from "@/components/SkeletonLoader";
import { EsproTokenModal } from "@/components/EsproTokenModal";
import { fetchAttendance, fetchHostelAttendance, AttendanceData, HostelBiometricInfo, ApiError } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { RefreshCw, Clock, AlertCircle, Calendar, BookOpen, KeyRound, Building2, Fingerprint } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [hostelData, setHostelData] = useState<HostelBiometricInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const loadAttendance = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [attResult, bioResult] = await Promise.all([
        fetchAttendance(),
        fetchHostelAttendance().catch(() => ({ is_hostelite: false })),
      ]);
      setData(attResult);
      setHostelData(bioResult);
      setSecondsAgo(0);
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 pb-24">
      {/* Top Navbar */}
      <Navbar
        student={data?.student || getAuthSession().student}
        onRefresh={() => loadAttendance(true)}
        isRefreshing={refreshing}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs sm:text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={() => loadAttendance(true)}
              className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-semibold hover:bg-rose-600 transition-colors flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Hero Section: Attendance Ring + Last Updated Badge */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Attendance Status
              </h2>
            </div>

            {/* Live refresh action badge */}
            <button
              onClick={() => loadAttendance(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-sm"
              title="Fetch latest live attendance marked by teachers"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-500" : "text-emerald-600 dark:text-emerald-400"}`}
              />
              <span>{refreshing ? "Checking Live ESPro..." : `Live • ${formatSecondsAgo(secondsAgo)}`}</span>
            </button>
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
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
              No attendance data yet. Tap refresh to fetch your latest records.
            </div>
          )}
        </section>

        {/* Today's Classes Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Today's Schedule
              </h3>
            </div>
            {data?.today_classes && data.today_classes.length > 0 && (
              <span className="text-xs text-slate-400 font-mono">
                {data.today_classes.length} classes
              </span>
            )}
          </div>

          {loading ? (
            <SkeletonList />
          ) : data?.today_classes ? (
            <TodayClasses classes={data.today_classes} />
          ) : null}
        </section>

        {/* Subject Cards Grid Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Courses Breakdown
              </h3>
            </div>
            {data?.subjects && (
              <span className="text-xs text-slate-400 font-mono">
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
                <SubjectCard key={idx} subject={sub} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
              No course subjects found.
            </div>
          )}
        </section>

        {/* Hostel Biometric Attendance (Visible ONLY for Hostel Residents) */}
        {hostelData?.is_hostelite && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Hostel Biometric Attendance
                </h3>
              </div>
              {hostelData.biometric_id && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  ID: {hostelData.biometric_id}
                </span>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {hostelData.hostel_name || "Christ University Student Hostel"}
                  </h4>
                  {hostelData.last_punch && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Last punch: {hostelData.last_punch}
                    </p>
                  )}
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Fingerprint className="w-4 h-4" />
                </div>
              </div>

              {hostelData.punches && hostelData.punches.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Recent Check-Ins & Check-Outs
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {hostelData.punches.slice(0, 5).map((punch, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              punch.punch_type === "IN" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {punch.punch_type || "IN"}
                          </span>
                          <span className="text-slate-400">{punch.date}</span>
                        </div>
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          {punch.punch_time || punch.status || "Recorded"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  Biometric registration active. Punch records update during hostel check-in hours.
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Tab Navigation */}
      <BottomNav />

      {/* Live ESPRO Token Modal */}
      <EsproTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => {
          setIsTokenModalOpen(false);
          loadAttendance(true);
        }}
      />
    </div>
  );
}

