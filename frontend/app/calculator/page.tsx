"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { fetchAttendance, SubjectAttendance } from "@/lib/api";
import { getAuthSession } from "@/lib/auth";
import {
  calculateAttendanceMetrics,
  simulateAttendance,
  CHRIST_MARKS_RULES,
  GRADE_POINTS_4_SCALE,
  GRADE_POINTS_10_SCALE,
  getGradeFromMarks,
  getResultDivision,
  CIA_PRESETS,
  TARGET_BENCHMARKS,
  calculateEseTargetPrediction,
  CiaComponent,
} from "@/lib/calculations";
import {
  Calculator as CalcIcon,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
  Minus,
  Award,
  BookOpen,
  Calendar,
  FileCheck2,
  Target,
  Sparkles,
  Trash2,
  RotateCcw,
  HelpCircle,
} from "lucide-react";

export default function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<"attendance" | "marks">("attendance");
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // TAB 1: ATTENDANCE & SAFE-SKIPS STATE
  // ==========================================
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState<number | "overall">("overall");
  const [conducted, setConducted] = useState<number>(60);
  const [attended, setAttended] = useState<number>(51);
  const [blueFormHours, setBlueFormHours] = useState<number>(0);
  const [yellowFormHours, setYellowFormHours] = useState<number>(0);
  const [targetPercentage, setTargetPercentage] = useState<number>(85);
  const [simExtraAttended, setSimExtraAttended] = useState<number>(0);
  const [simExtraMissed, setSimExtraMissed] = useState<number>(0);

  // Fetch real subjects on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetchAttendance();
        if (res.subjects && res.subjects.length > 0) {
          setSubjects(res.subjects);
          // Default to overall sum
          const totConducted = res.subjects.reduce((sum, s) => sum + s.total, 0);
          const totAttended = res.subjects.reduce((sum, s) => sum + s.attended, 0);
          if (totConducted > 0) {
            setConducted(totConducted);
            setAttended(totAttended);
          }
        }
      } catch {
        // Fallback default demo data
        setConducted(60);
        setAttended(52);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // When user selects a specific subject from their enrolled list
  const handleSubjectSelect = (val: string) => {
    if (val === "overall") {
      setSelectedSubjectIdx("overall");
      const totConducted = subjects.reduce((sum, s) => sum + s.total, 0);
      const totAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
      setConducted(totConducted || 60);
      setAttended(totAttended || 51);
    } else {
      const idx = Number(val);
      setSelectedSubjectIdx(idx);
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

  // ==========================================
  // TAB 2: MARKS & ESE PREDICTOR STATE
  // ==========================================
  const [scaleMode, setScaleMode] = useState<"4.0" | "10.0">("4.0");
  const [ciaPresetKey, setCiaPresetKey] = useState<string>("50_50");
  const [eseConductedMax, setEseConductedMax] = useState<number>(100);
  const [eseWeightage, setEseWeightage] = useState<number>(50);
  const [targetGoal, setTargetGoal] = useState<string>("O");

  const [ciaComponents, setCiaComponents] = useState<CiaComponent[]>([
    { id: "cia1", name: "CIA 1 Unit Test", conductedMax: 20, weightage: 10, scoredMarks: 18, enabled: true },
    { id: "cia2", name: "Mid-Sem Exam (CIA 2)", conductedMax: 50, weightage: 25, scoredMarks: 42, enabled: true },
    { id: "cia3", name: "CIA 3 / Assignment / Project", conductedMax: 20, weightage: 10, scoredMarks: 19, enabled: true },
    { id: "att", name: "Attendance Component", conductedMax: 5, weightage: 5, scoredMarks: 5, enabled: true },
  ]);

  // GPA Course List
  const [gpaCourses, setGpaCourses] = useState<
    Array<{ id: number; name: string; credits: number; grade: string; marks: number }>
  >([
    { id: 1, name: "Core Course 1", credits: 4, grade: "O", marks: 85 },
    { id: 2, name: "Core Course 2", credits: 4, grade: "A+", marks: 74 },
    { id: 3, name: "Discipline Elective", credits: 3, grade: "A", marks: 68 },
    { id: 4, name: "Open Elective", credits: 3, grade: "O", marks: 82 },
    { id: 5, name: "Laboratory Course", credits: 2, grade: "O", marks: 90 },
  ]);
  const [prevCgpa, setPrevCgpa] = useState<string>("");
  const [prevCredits, setPrevCredits] = useState<string>("");

  const handlePresetChange = (key: string) => {
    setCiaPresetKey(key);
    const preset = CIA_PRESETS[key];
    if (preset) {
      setEseConductedMax(preset.eseConductedMax);
      setEseWeightage(preset.eseWeightage);
      setCiaComponents(preset.components.map((c) => ({ ...c })));
    }
  };

  const updateCiaComponent = (id: string, field: "scoredMarks" | "conductedMax" | "weightage", val: number) => {
    setCiaComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: Math.max(0, val) } : c))
    );
  };

  const esePrediction = calculateEseTargetPrediction(
    ciaComponents,
    eseWeightage,
    eseConductedMax,
    targetGoal
  );

  // GPA calculation
  const activeGradeScale = scaleMode === "4.0" ? GRADE_POINTS_4_SCALE : GRADE_POINTS_10_SCALE;
  const currentTotalCredits = gpaCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
  const currentTotalPoints = gpaCourses.reduce(
    (sum, c) => sum + (c.credits || 0) * (activeGradeScale[c.grade]?.point || 0),
    0
  );
  const calculatedSgpa =
    currentTotalCredits > 0 ? (currentTotalPoints / currentTotalCredits).toFixed(2) : "0.00";

  let cumulativeCgpa = calculatedSgpa;
  if (prevCgpa && prevCredits && Number(prevCredits) > 0) {
    const totalOldPoints = Number(prevCgpa) * Number(prevCredits);
    const totalAllCredits = Number(prevCredits) + currentTotalCredits;
    cumulativeCgpa = ((totalOldPoints + currentTotalPoints) / totalAllCredits).toFixed(2);
  }

  const averagePercentage =
    gpaCourses.length > 0
      ? Math.round(
          gpaCourses.reduce((sum, c) => sum + (c.marks || 0), 0) / gpaCourses.length
        )
      : 0;
  const resultDivision = getResultDivision(averagePercentage);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 pb-24 selection:bg-emerald-500/20">
      <Navbar student={getAuthSession().student} />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Top Segmented Navigation Switcher */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "attendance"
                  ? "bg-[#0f2b5c] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Attendance & Safe Skips</span>
            </button>
            <button
              onClick={() => setActiveTab("marks")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "marks"
                  ? "bg-[#0f2b5c] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Marks & ESE Predictor</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: ATTENDANCE & SAFE SKIPS CALCULATOR                    */}
        {/* ============================================================ */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            {/* Quick-load from student enrolled subjects */}
            {subjects.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Sync from Enrolled Subject
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Select any course to auto-fill its live attended and conducted hours
                    </span>
                  </div>
                </div>

                <select
                  value={selectedSubjectIdx}
                  onChange={(e) => handleSubjectSelect(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c]"
                >
                  <option value="overall">All Courses Combined (Overall)</option>
                  {subjects.map((s, idx) => (
                    <option key={idx} value={idx}>
                      {s.name} ({s.attended}/{s.total} hrs)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Core Metrics Display Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Attendance Health
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        metrics.status === "safe"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200"
                          : metrics.status === "warning"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200"
                      }`}
                    >
                      {metrics.eligibility.label}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
                    {metrics.adjustedPercentage}%
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {metrics.message}
                  </p>
                </div>

                {/* Safe Skips Callout Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-4">
                  <div className="text-center">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">
                      {metrics.safeSkips}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Safe Skips
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="text-center">
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400 block">
                      {metrics.classesNeeded}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Needed
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance Inputs: Conducted, Attended, Blue Form, Yellow Form */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Total Conducted
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={conducted}
                    onChange={(e) => setConducted(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0f2b5c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Total Attended
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={attended}
                    onChange={(e) => setAttended(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0f2b5c]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>Blue Form (Duty)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={blueFormHours}
                    onChange={(e) => setBlueFormHours(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-sm font-semibold text-blue-900 dark:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>Yellow Form (Med)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={yellowFormHours}
                    onChange={(e) => setYellowFormHours(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-sm font-semibold text-amber-900 dark:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>

              {/* Target Attendance Slider */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Target Attendance Requirement
                  </label>
                  <div className="flex items-center gap-2">
                    {[75, 85, 90].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setTargetPercentage(preset)}
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                          targetPercentage === preset
                            ? "bg-[#0f2b5c] text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 min-w-10 text-right">
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
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#0f2b5c]"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>60% (Minimum)</span>
                  <span>75% (Condonation)</span>
                  <span>85% (Official Rule)</span>
                  <span>95% (Distinction)</span>
                </div>
              </div>

              {/* Future Classes Simulator */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Future Classes Simulator
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      See how attending or missing future hours alters your percentage
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {projectedPercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      Projected
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <div className="flex-1 w-full flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Attend next classes: +{simExtraAttended}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSimExtraAttended((prev) => Math.max(0, prev - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm"
                      >
                        -
                      </button>
                      <button
                        onClick={() => setSimExtraAttended((prev) => prev + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 w-full flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                      Miss next classes: +{simExtraMissed}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSimExtraMissed((prev) => Math.max(0, prev - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm"
                      >
                        -
                      </button>
                      <button
                        onClick={() => setSimExtraMissed((prev) => prev + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: MARKS & ESE TARGET PREDICTOR                          */}
        {/* ============================================================ */}
        {activeTab === "marks" && (
          <div className="space-y-6">
            {/* Pattern Presets */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Course Evaluation Pattern
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select your program's Continuous Internal Assessment (CIA) & End-Sem model
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {Object.keys(CIA_PRESETS).map((key) => (
                    <button
                      key={key}
                      onClick={() => handlePresetChange(key)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        ciaPresetKey === key
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {key.replace("_", ":")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Benchmark Goal */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Target Benchmark:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(TARGET_BENCHMARKS).map((key) => (
                    <button
                      key={key}
                      onClick={() => setTargetGoal(key)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                        targetGoal === key
                          ? "bg-[#0f2b5c] text-white border-[#0f2b5c] shadow-sm"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {TARGET_BENCHMARKS[key].label.split(" ")[0]} ({TARGET_BENCHMARKS[key].targetPct}%)
                    </button>
                  ))}
                </div>
              </div>

              {/* Prediction Result Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  esePrediction.isPossible
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60"
                }`}
              >
                <Target
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    esePrediction.isPossible ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Required End-Sem Question Paper Score
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {Math.ceil(esePrediction.effectiveNeededEseMarks)} / {eseConductedMax}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {esePrediction.summaryMessage}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Current Scaled CIA: {esePrediction.totalCiaConvertedScore.toFixed(1)} / {esePrediction.totalCiaMaxWeightage} Marks • Christ University 40% Question Paper Minimum Rule Active
                  </p>
                </div>
              </div>

              {/* Component breakdown inputs */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Internal Assessment Components
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ciaComponents.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span>{comp.name}</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          Wt: {comp.weightage} marks
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">
                            Scored
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={comp.conductedMax}
                            value={comp.scoredMarks}
                            onChange={(e) =>
                              updateCiaComponent(comp.id, "scoredMarks", Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                        <span className="text-slate-400 pt-4">/</span>
                        <div className="flex-1">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">
                            Conducted Max
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={comp.conductedMax}
                            onChange={(e) =>
                              updateCiaComponent(comp.id, "conductedMax", Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                        <div className="text-right pt-4 min-w-14">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {(
                              (comp.scoredMarks / Math.max(1, comp.conductedMax)) *
                              comp.weightage
                            ).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* GPA & Semester Classification Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Semester SGPA & Cumulative CGPA
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official Christ University 4.0 grading scale with result classification
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setScaleMode("4.0")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      scaleMode === "4.0"
                        ? "bg-[#0f2b5c] text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    4.0 Scale (Official)
                  </button>
                  <button
                    onClick={() => setScaleMode("10.0")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      scaleMode === "10.0"
                        ? "bg-[#0f2b5c] text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    10.0 Scale
                  </button>
                </div>
              </div>

              {/* GPA Results Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Calculated SGPA
                  </span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">
                    {calculatedSgpa}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {scaleMode === "4.0" ? "Max 4.00" : "Max 10.00"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cumulative CGPA
                  </span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {cumulativeCgpa}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Overall</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Total Credits
                  </span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">
                    {currentTotalCredits}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{gpaCourses.length} Courses</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Division
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 block truncate">
                    {resultDivision.label}
                  </span>
                </div>
              </div>

              {/* Cumulative Inputs */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Previous Cumulative CGPA (optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={scaleMode === "4.0" ? "4.0" : "10.0"}
                    value={prevCgpa}
                    onChange={(e) => setPrevCgpa(e.target.value)}
                    placeholder="e.g. 3.45"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Previous Total Credits
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={prevCredits}
                    onChange={(e) => setPrevCredits(e.target.value)}
                    placeholder="e.g. 40"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
