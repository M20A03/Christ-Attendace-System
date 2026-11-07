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
import { fetchAttendance, AttendanceData, ApiError } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import { RefreshCw, Clock, AlertCircle, Calendar, BookOpen, KeyRound } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AttendanceData | null>(null);
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
      const result = await fetchAttendance();
      setData(result);
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

            {/* Last updated badge with refresh action */}
            <button
              onClick={() => loadAttendance(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Last updated: {formatSecondsAgo(secondsAgo)}</span>
              <RefreshCw
                className={`w-3 h-3 ml-0.5 text-slate-400 ${refreshing ? "animate-spin text-emerald-500" : ""}`}
              />
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

