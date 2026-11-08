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
  Target,
  Sparkles,
  HelpCircle,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<"attendance" | "marks">("attendance");

  // ==========================================
  // TAB 1: ATTENDANCE & SAFE SKIPS STATE
  // ==========================================
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

  // ==========================================
  // TAB 2: MARKS & ESE PREDICTOR STATE (Sole 4.0 Scale)
  // ==========================================
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

  // Official Christ University 4.0 Scale Calculations
  const currentTotalCredits = gpaCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
  const currentTotalPoints = gpaCourses.reduce(
    (sum, c) => sum + (c.credits || 0) * (GRADE_POINTS_4_SCALE[c.grade]?.point || 0),
    0
  );
  const calculatedSgpa =
    currentTotalCredits > 0 ? (currentTotalPoints / currentTotalCredits).toFixed(2) : "0.00";

  let cumulativeCgpa = calculatedSgpa;
  const pCgpa = parseFloat(prevCgpa);
  const pCredits = parseFloat(prevCredits);
  if (!isNaN(pCgpa) && !isNaN(pCredits) && pCredits > 0) {
    const totalOldPoints = pCgpa * pCredits;
    const totalAllCredits = pCredits + currentTotalCredits;
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a12] text-slate-900 dark:text-slate-100 pb-24 selection:bg-[#0f2b5c]/10 selection:text-[#0f2b5c] dark:selection:bg-blue-500/20 dark:selection:text-blue-300 transition-colors duration-200">
      <Navbar student={getAuthSession().student} />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Top High-Tech Segmented Switcher */}
        <div className="flex items-center justify-center">
          <div className="relative inline-flex p-1.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 shadow-[0_2px_12px_rgba(15,43,92,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                activeTab === "attendance" ? "text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Attendance & Safe Skips</span>
            </button>

            <button
              onClick={() => setActiveTab("marks")}
              className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                activeTab === "marks" ? "text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Marks & ESE Predictor</span>
            </button>

            {/* Sliding spring background pill */}
            <motion.div
              layoutId="calcTabPill"
              className="absolute inset-1.5 rounded-xl bg-[#0f2b5c] dark:bg-blue-600 shadow-sm pointer-events-none"
              style={{
                left: activeTab === "attendance" ? "6px" : "calc(50% + 2px)",
                width: "calc(50% - 8px)",
              }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: ATTENDANCE & SAFE SKIPS CALCULATOR                    */}
        {/* ============================================================ */}
        <AnimatePresence mode="wait">
          {activeTab === "attendance" && (
            <motion.div
              key="attendance-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Quick-load from student enrolled subjects */}
              {subjects.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-[0_2px_12px_rgba(15,43,92,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Sync from Enrolled Subject
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Select any course to auto-fill its live attended and conducted hours
                      </span>
                    </div>
                  </div>

                  <select
                    value={selectedSubjectIdx}
                    onChange={(e) => handleSubjectSelect(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] shadow-inner"
                  >
                    <option value="overall">All Courses Combined (Overall)</option>
                    {subjects.map((s, idx) => (
                      <option key={idx} value={idx}>
                        {s.name} ({s.attended}/{s.total} • {s.percentage}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Main Attendance Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,43,92,0.05)] space-y-6">
                {/* Header Metrics */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#0f2b5c]" />
                      <span>Christ Attendance Engine</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {metrics.percentage}%
                      <span className="text-sm font-semibold text-slate-500 ml-2">
                        (Raw: {metrics.rawPercentage}%)
                      </span>
                    </h2>
                    <p className="text-xs font-medium text-slate-600 mt-1 flex items-center gap-1.5">
                      {metrics.status === "safe" && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      )}
                      {metrics.status === "warning" && (
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      )}
                      {metrics.status === "danger" && (
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <span>{metrics.message}</span>
                    </p>
                  </div>

                  {/* Summary metric boxes */}
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center min-w-[90px]">
                      <span className="text-2xl font-black text-emerald-600 block">
                        {metrics.safeSkips}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                        Safe Skips
                      </span>
                    </div>

                    <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-center min-w-[90px]">
                      <span className="text-2xl font-black text-slate-800 block">
                        {metrics.classesNeeded}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Needed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attendance Inputs: Conducted, Attended, Blue Form, Yellow Form */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Total Conducted
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={conducted}
                      onChange={(e) => setConducted(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Total Attended
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={attended}
                      onChange={(e) => setAttended(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1.5">
                      Blue Form (Medical)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={blueFormHours}
                      onChange={(e) => setBlueFormHours(Math.max(0, Number(e.target.value)))}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/60 text-sm font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                    <span className="text-[10px] font-medium text-slate-500 block mt-1">Medical Certificates</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">
                      Yellow Form (Duty)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={yellowFormHours}
                      onChange={(e) => setYellowFormHours(Math.max(0, Number(e.target.value)))}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/60 text-sm font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-600 transition-all"
                    />
                    <span className="text-[10px] font-medium text-slate-500 block mt-1">Fests & Hackathons</span>
                  </div>
                </div>

                {/* Form Rule Clarification */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <HelpCircle className="w-4 h-4 text-[#0f2b5c] flex-shrink-0" />
                    <span>Christ University Form Regulations:</span>
                  </div>
                  <p className="leading-relaxed">
                    • <strong className="text-blue-700">Blue Form (Medical Leave):</strong> Submitted with hospital/doctor certificate to condone sickness absence between 75% and 85%.
                  </p>
                  <p className="leading-relaxed">
                    • <strong className="text-amber-700">Yellow Form (Duty Leave):</strong> Co-curricular representation, university fests, sports, or hackathons credited directly into attendance.
                  </p>
                </div>

                {/* Target Attendance Requirement */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#0f2b5c]" />
                      Target Attendance Requirement
                    </label>
                    <div className="flex items-center gap-2">
                      {[75, 85, 90].map((preset) => (
                        <motion.button
                          key={preset}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setTargetPercentage(preset)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            targetPercentage === preset
                              ? "bg-[#0f2b5c] text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {preset}%
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={targetPercentage}
                    onChange={(e) => setTargetPercentage(Number(e.target.value))}
                    className="w-full accent-[#0f2b5c] h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>75% (Condonation)</span>
                    <span>85% (Official Rule)</span>
                    <span>95% (Distinction)</span>
                  </div>
                </div>

                {/* Future Classes Simulator */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Future Classes Simulator
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        See how attending or missing future hours alters your percentage
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-slate-900">
                        {projectedPercentage}%
                      </span>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Projected
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <div className="flex-1 w-full flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-slate-200/90 shadow-sm">
                      <span className="text-xs font-bold text-emerald-700">
                        Attend next classes: +{simExtraAttended}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSimExtraAttended((prev) => Math.max(0, prev - 1))}
                          className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm hover:bg-slate-200"
                        >
                          -
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSimExtraAttended((prev) => prev + 1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm hover:bg-slate-200"
                        >
                          +
                        </motion.button>
                      </div>
                    </div>

                    <div className="flex-1 w-full flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-slate-200/90 shadow-sm">
                      <span className="text-xs font-bold text-rose-700">
                        Miss next classes: +{simExtraMissed}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSimExtraMissed((prev) => Math.max(0, prev - 1))}
                          className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm hover:bg-slate-200"
                        >
                          -
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSimExtraMissed((prev) => prev + 1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm hover:bg-slate-200"
                        >
                          +
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: MARKS & ESE TARGET PREDICTOR (Sole 4.0 Scale)         */}
          {/* ============================================================ */}
          {activeTab === "marks" && (
            <motion.div
              key="marks-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Pattern Presets */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,43,92,0.05)] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Course Evaluation Pattern
                    </h3>
                    <p className="text-xs text-slate-500">
                      Select your Continuous Internal Assessment (CIA) & End-Sem model
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
                    {Object.keys(CIA_PRESETS).map((key) => (
                      <motion.button
                        key={key}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePresetChange(key)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          ciaPresetKey === key
                            ? "bg-white text-[#0f2b5c] shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {key.replace("_", ":")}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Target Benchmark Goal */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Target Benchmark:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(TARGET_BENCHMARKS).map((key) => (
                      <motion.button
                        key={key}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setTargetGoal(key)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          targetGoal === key
                            ? "bg-[#0f2b5c] text-white border-[#0f2b5c] shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {TARGET_BENCHMARKS[key].label.split(" ")[0]} ({TARGET_BENCHMARKS[key].targetPct}%)
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Prediction Result Banner */}
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                    esePrediction.isPossible
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-rose-50 border-rose-200"
                  }`}
                >
                  <Target
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      esePrediction.isPossible ? "text-emerald-600" : "text-rose-600"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Required End-Sem Question Paper Score
                      </span>
                      <span className="text-xl font-black text-slate-900">
                        {Math.ceil(esePrediction.effectiveNeededEseMarks)} / {eseConductedMax}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      {esePrediction.summaryMessage}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Current Scaled CIA: {esePrediction.totalCiaConvertedScore.toFixed(1)} / {esePrediction.totalCiaMaxWeightage} Marks • Christ University 40% Question Paper Minimum Rule Active
                    </p>
                  </div>
                </div>

                {/* Component breakdown inputs */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Internal Assessment Components
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ciaComponents.map((comp) => (
                      <div
                        key={comp.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span>{comp.name}</span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            Weight: {comp.weightage} marks
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
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c]"
                            />
                          </div>
                          <span className="text-slate-400 pt-4 font-bold">/</span>
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
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c]"
                            />
                          </div>
                          <div className="text-right pt-4 min-w-14">
                            <span className="text-xs font-black text-emerald-600">
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

              {/* SGPA & CGPA Simulator (Dedicated 4.0 Scale) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_4px_24px_rgba(15,43,92,0.05)] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Semester SGPA & Cumulative CGPA
                    </h3>
                    <p className="text-xs text-slate-500">
                      Official Christ University 4.0 grading scale with result classification
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                    Official 4.0 Scale
                  </div>
                </div>

                {/* GPA Results Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Calculated SGPA
                    </span>
                    <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                      {calculatedSgpa}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Max 4.00</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Cumulative CGPA
                    </span>
                    <span className="text-2xl font-black text-emerald-600 mt-0.5 block">
                      {cumulativeCgpa}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Overall</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Total Credits
                    </span>
                    <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                      {currentTotalCredits}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{gpaCourses.length} Courses</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Division
                    </span>
                    <span className="text-xs font-bold text-slate-800 mt-2 block truncate">
                      {resultDivision.label}
                    </span>
                  </div>
                </div>

                {/* Cumulative Inputs */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Previous Cumulative CGPA (optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4.0"
                      value={prevCgpa}
                      onChange={(e) => setPrevCgpa(e.target.value)}
                      placeholder="e.g. 3.45"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Previous Total Credits
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={prevCredits}
                      onChange={(e) => setPrevCredits(e.target.value)}
                      placeholder="e.g. 40"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2b5c]"
                    />
                  </div>
                </div>

                {/* Course List & Grade Points Table */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Courses & Enrolled Credits
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setGpaCourses((prev) => [
                          ...prev,
                          {
                            id: Date.now(),
                            name: `Course ${prev.length + 1}`,
                            credits: 3,
                            grade: "O",
                            marks: 80,
                          },
                        ])
                      }
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0f2b5c] text-white text-xs font-bold shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Course</span>
                    </motion.button>
                  </div>

                  <div className="space-y-2">
                    {gpaCourses.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70"
                      >
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGpaCourses((prev) =>
                              prev.map((item) =>
                                item.id === c.id ? { ...item, name: val } : item
                              )
                            );
                          }}
                          className="flex-1 text-xs font-semibold bg-transparent text-slate-800 focus:outline-none"
                        />

                        {/* Credits */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Cred:</span>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={c.credits}
                            onChange={(e) => {
                              const cred = Math.max(1, Number(e.target.value));
                              setGpaCourses((prev) =>
                                prev.map((item) =>
                                  item.id === c.id ? { ...item, credits: cred } : item
                                )
                              );
                            }}
                            className="w-12 px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 text-center"
                          />
                        </div>

                        {/* Grade Dropdown (4.0 scale points) */}
                        <select
                          value={c.grade}
                          onChange={(e) => {
                            const gr = e.target.value;
                            setGpaCourses((prev) =>
                              prev.map((item) =>
                                item.id === c.id ? { ...item, grade: gr } : item
                              )
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none"
                        >
                          {Object.keys(GRADE_POINTS_4_SCALE).map((g) => (
                            <option key={g} value={g}>
                              {g} ({GRADE_POINTS_4_SCALE[g].point.toFixed(1)} pts)
                            </option>
                          ))}
                        </select>

                        {/* Remove course button */}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            setGpaCourses((prev) => prev.filter((item) => item.id !== c.id))
                          }
                          disabled={gpaCourses.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}
