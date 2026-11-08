/**
 * Official CHRIST (Deemed to be University) Academic & Attendance Regulations
 * Extracted and calibrated from Christ University student regulations and SAMAGRA portal.
 */

// Exact Official CHRIST (Deemed to be University) Grading Scale from Marks Card
export const CHRIST_MARKS_RULES = {
  grades4Scale: [
    { range: "80% & Above", grade: "O", point: 4.0, label: "Outstanding" },
    { range: "70% – 79.99%", grade: "A+", point: 3.6, label: "Excellent" },
    { range: "60% – 69.99%", grade: "A", point: 3.2, label: "Very Good" },
    { range: "55% – 59.99%", grade: "B+", point: 2.8, label: "Good" },
    { range: "50% – 54.99%", grade: "B", point: 2.4, label: "Above Average" },
    { range: "45% – 49.99%", grade: "C", point: 2.0, label: "Average" },
    { range: "40% – 44.99%", grade: "P", point: 1.6, label: "Pass" },
    { range: "Less than 40%", grade: "F", point: 0.0, label: "Fail / Reappear" },
  ],
  grades10Scale: [
    { range: "90% – 100%", grade: "O", point: 10.0, label: "Outstanding" },
    { range: "80% – 89.99%", grade: "A+", point: 9.0, label: "Excellent" },
    { range: "70% – 79.99%", grade: "A", point: 8.0, label: "Very Good" },
    { range: "60% – 69.99%", grade: "B+", point: 7.0, label: "Good" },
    { range: "55% – 59.99%", grade: "B", point: 6.0, label: "Above Average" },
    { range: "50% – 54.99%", grade: "C", point: 5.0, label: "Average" },
    { range: "40% – 49.99%", grade: "P", point: 4.0, label: "Pass" },
    { range: "< 40%", grade: "F", point: 0.0, label: "Fail / Reappear" },
  ],
  results: [
    { range: "75% & Above", label: "First Class with Distinction", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" },
    { range: "60% – 74.99%", label: "First Class", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" },
    { range: "50% – 59.99%", label: "Second Class", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" },
    { range: "40% – 49.99%", label: "Pass Class", color: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" },
    { range: "< 40%", label: "Fail (Reappear Required)", color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800" },
  ],
};

export const GRADE_POINTS_4_SCALE: Record<string, { point: number; label: string }> = {
  O: { point: 4.0, label: "80% & Above (4.0 pts)" },
  "A+": { point: 3.6, label: "70% – 79.99% (3.6 pts)" },
  A: { point: 3.2, label: "60% – 69.99% (3.2 pts)" },
  "B+": { point: 2.8, label: "55% – 59.99% (2.8 pts)" },
  B: { point: 2.4, label: "50% – 54.99% (2.4 pts)" },
  C: { point: 2.0, label: "45% – 49.99% (2.0 pts)" },
  P: { point: 1.6, label: "40% – 44.99% (1.6 pts)" },
  F: { point: 0.0, label: "Less than 40% (0.0 pts)" },
};

/** Convert marks percentage to CHRIST 4.0 scale letter grade */
export function getGradeFromMarks(marks: number | string): string {
  const m = Number(marks);
  if (isNaN(m) || m < 40) return "F";
  if (m >= 80) return "O";
  if (m >= 70) return "A+";
  if (m >= 60) return "A";
  if (m >= 55) return "B+";
  if (m >= 50) return "B";
  if (m >= 45) return "C";
  if (m >= 40) return "P";
  return "F";
}

/** Get result classification division based on percentage */
export function getResultDivision(pct: number) {
  if (pct >= 75) return CHRIST_MARKS_RULES.results[0];
  if (pct >= 60) return CHRIST_MARKS_RULES.results[1];
  if (pct >= 50) return CHRIST_MARKS_RULES.results[2];
  if (pct >= 40) return CHRIST_MARKS_RULES.results[3];
  return CHRIST_MARKS_RULES.results[4];
}

export interface AttendanceMathResult {
  percentage: number;
  rawPercentage: number;
  adjustedPercentage: number;
  classesNeeded: number;
  safeSkips: number;
  status: "safe" | "warning" | "danger";
  message: string;
  eligibility: {
    status: "regular" | "condonation" | "shortage";
    label: string;
    description: string;
  };
}

/**
 * Calculates authentic Christ University attendance metrics including:
 * - Blue Form (Medical Leave: approved medical certificates / hospitalization)
 * - Yellow Form (Duty Leave: co-curricular, hackathons, fests, sports, symposiums)
 */
export function calculateAttendanceMetrics(
  attended: number,
  total: number,
  targetFraction: number = 0.85,
  blueFormHours: number = 0,
  yellowFormHours: number = 0
): AttendanceMathResult {
  const conducted = Math.max(1, total);
  const rawAtt = Math.max(0, attended);
  const blue = Math.max(0, blueFormHours);
  const yellow = Math.max(0, yellowFormHours);
  const target = Math.min(1.0, Math.max(0.1, targetFraction));
  const targetPct = target * 100;

  const totalEffectiveAttended = rawAtt + blue + yellow;
  const rawPct = Math.min(100, Math.round((rawAtt / conducted) * 1000) / 10);
  const adjustedPct = Math.min(100, Math.round((totalEffectiveAttended / conducted) * 1000) / 10);

  // Safe Skips:
  // Can skip = max(0, floor((totalEffectiveAttended * 100) / targetPct - conducted))
  const safeSkips = Math.max(
    0,
    Math.floor((totalEffectiveAttended * 100) / targetPct - conducted)
  );

  // Consecutive classes needed to reach target if below:
  let classesNeeded = 0;
  if (adjustedPct < targetPct && target < 1.0) {
    classesNeeded = Math.ceil(
      (targetPct * conducted - 100 * totalEffectiveAttended) / (100 - targetPct)
    );
  }

  let status: "safe" | "warning" | "danger" = "safe";
  if (adjustedPct >= 85) {
    status = "safe";
  } else if (adjustedPct >= 75) {
    status = "warning";
  } else {
    status = "danger";
  }

  let message = "";
  if (adjustedPct >= targetPct) {
    if (safeSkips === 0) {
      message = "On borderline — attend your next class";
    } else {
      message = `Can safely skip ${safeSkips} class${safeSkips === 1 ? "" : "es"}`;
    }
  } else {
    message = `Must attend ${classesNeeded} consecutive class${classesNeeded === 1 ? "" : "es"} to hit ${targetPct}%`;
  }

  // Official Christ University Examination Eligibility Rule:
  let eligibility: AttendanceMathResult["eligibility"];
  if (adjustedPct >= 85) {
    eligibility = {
      status: "regular",
      label: "Eligible (Regular)",
      description: "No fines or condonation required. Hall ticket issued automatically.",
    };
  } else if (adjustedPct >= 75) {
    eligibility = {
      status: "condonation",
      label: "Eligible with Form (75%–85%)",
      description: "Eligible for End-Sem Exam with approved Blue (Medical) / Yellow (Duty) form or condonation.",
    };
  } else {
    eligibility = {
      status: "shortage",
      label: "Attendance Shortage (< 75%)",
      description: "Strict shortage. University rules deny exam hall ticket unless condoned by Dean.",
    };
  }

  return {
    percentage: adjustedPct,
    rawPercentage: rawPct,
    adjustedPercentage: adjustedPct,
    classesNeeded,
    safeSkips,
    status,
    message,
    eligibility,
  };
}

/**
 * Simulates future attendance if student attends X more classes or misses Y classes.
 */
export function simulateAttendance(
  attended: number,
  total: number,
  additionalAttended: number,
  additionalMissed: number,
  blueFormHours: number = 0,
  yellowFormHours: number = 0
): number {
  const newAttended = attended + additionalAttended + blueFormHours + yellowFormHours;
  const newTotal = total + additionalAttended + additionalMissed;
  if (newTotal <= 0) return 100;
  return Math.min(100, Math.round((newAttended / newTotal) * 1000) / 10);
}

// ==========================================
// CIA & ESE TARGET PREDICTOR MODELS & LOGIC
// ==========================================

export interface CiaComponent {
  id: string;
  name: string;
  conductedMax: number;
  weightage: number;
  scoredMarks: number;
  enabled: boolean;
}

export const CIA_PRESETS: Record<
  string,
  {
    name: string;
    description: string;
    eseConductedMax: number;
    eseWeightage: number;
    components: CiaComponent[];
  }
> = {
  "50_50": {
    name: "50:50 Pattern (Standard Theory)",
    description: "50 Marks CIA + 50 Marks ESE (Question paper: 100 marks converted to 50)",
    eseConductedMax: 100,
    eseWeightage: 50,
    components: [
      { id: "cia1", name: "CIA 1 Unit Test", conductedMax: 20, weightage: 10, scoredMarks: 18, enabled: true },
      { id: "cia2", name: "Mid-Sem Exam (CIA 2)", conductedMax: 50, weightage: 25, scoredMarks: 42, enabled: true },
      { id: "cia3", name: "CIA 3 / Assignment / Project", conductedMax: 20, weightage: 10, scoredMarks: 19, enabled: true },
      { id: "att", name: "Attendance Component", conductedMax: 5, weightage: 5, scoredMarks: 5, enabled: true },
    ],
  },
  "70_30": {
    name: "70:30 Pattern (UG Programs)",
    description: "70 Marks CIA + 30 Marks ESE (Question paper: 50 marks converted to 30)",
    eseConductedMax: 50,
    eseWeightage: 30,
    components: [
      { id: "cia1", name: "CIA 1 Assessment", conductedMax: 20, weightage: 20, scoredMarks: 18, enabled: true },
      { id: "cia2", name: "Mid-Sem Exam (CIA 2)", conductedMax: 50, weightage: 25, scoredMarks: 42, enabled: true },
      { id: "cia3", name: "CIA 3 / Mini-Project", conductedMax: 20, weightage: 20, scoredMarks: 19, enabled: true },
      { id: "att", name: "Attendance Component", conductedMax: 5, weightage: 5, scoredMarks: 5, enabled: true },
    ],
  },
  "60_40": {
    name: "60:40 Pattern (Specialized Courses)",
    description: "60 Marks CIA + 40 Marks ESE (Question paper: 100 marks converted to 40)",
    eseConductedMax: 100,
    eseWeightage: 40,
    components: [
      { id: "cia1", name: "CIA 1 Assessment", conductedMax: 20, weightage: 15, scoredMarks: 18, enabled: true },
      { id: "cia2", name: "Mid-Sem Exam (CIA 2)", conductedMax: 50, weightage: 25, scoredMarks: 42, enabled: true },
      { id: "cia3", name: "CIA 3 Assessment", conductedMax: 20, weightage: 15, scoredMarks: 19, enabled: true },
      { id: "att", name: "Attendance Component", conductedMax: 5, weightage: 5, scoredMarks: 5, enabled: true },
    ],
  },
  "100_0": {
    name: "100:0 Pattern (Practical / Lab Only)",
    description: "100% Continuous Lab & Project Assessment (No Written ESE)",
    eseConductedMax: 0,
    eseWeightage: 0,
    components: [
      { id: "lab1", name: "Continuous Lab Exercises", conductedMax: 40, weightage: 40, scoredMarks: 36, enabled: true },
      { id: "cia2", name: "Mid-Sem Practical Exam", conductedMax: 50, weightage: 25, scoredMarks: 44, enabled: true },
      { id: "proj", name: "Project & Record Assessment", conductedMax: 30, weightage: 30, scoredMarks: 28, enabled: true },
      { id: "att", name: "Attendance Component", conductedMax: 5, weightage: 5, scoredMarks: 5, enabled: true },
    ],
  },
};

export const TARGET_BENCHMARKS: Record<
  string,
  { label: string; targetPct: number; badgeColor: string }
> = {
  O: { label: "Grade O (80%+ / 4.0 Point)", targetPct: 80, badgeColor: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700" },
  DISTINCTION: { label: "First Class Distinction (75%+)", targetPct: 75, badgeColor: "text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700" },
  "A+": { label: "Grade A+ (70%+ / 3.6 Point)", targetPct: 70, badgeColor: "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-700" },
  A: { label: "Grade A (60%+ / 3.2 Point)", targetPct: 60, badgeColor: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700" },
  "B+": { label: "Grade B+ (55%+ / 2.8 Point)", targetPct: 55, badgeColor: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700" },
  PASS: { label: "Pass Class (40%+ / 1.6 Point)", targetPct: 40, badgeColor: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700" },
};

export interface EsePredictionResult {
  totalCiaConvertedScore: number;
  totalCiaMaxWeightage: number;
  totalCourseMaxMarks: number;
  targetGoalPct: number;
  requiredTotalMarks: number;
  neededEseWeighted: number;
  neededEsePaperMarks: number;
  minMandatoryEsePaperMarks: number;
  effectiveNeededEseMarks: number;
  isPossible: boolean;
  maxPossibleOverallMarks: number;
  maxPossibleOverallPct: number;
  summaryMessage: string;
}

/**
 * Calculates needed ESE score to hit target benchmark based on Christ University rules:
 * - Includes Christ 40% mandatory minimum on question paper
 */
export function calculateEseTargetPrediction(
  components: CiaComponent[],
  eseWeightage: number,
  eseConductedMax: number,
  targetGoalKey: string = "O"
): EsePredictionResult {
  const enabledComponents = components.filter((c) => c.enabled);
  const totalCiaConvertedScore = enabledComponents.reduce(
    (sum, c) =>
      sum +
      (c.conductedMax > 0
        ? (Number(c.scoredMarks) / Number(c.conductedMax)) * Number(c.weightage)
        : 0),
    0
  );
  const totalCiaMaxWeightage = enabledComponents.reduce(
    (sum, c) => sum + (Number(c.weightage) || 0),
    0
  );
  const totalCourseMaxMarks = totalCiaMaxWeightage + (Number(eseWeightage) || 0);

  const goal = TARGET_BENCHMARKS[targetGoalKey] || TARGET_BENCHMARKS.O;
  const targetGoalPct = goal.targetPct;
  const requiredTotalMarks = (targetGoalPct / 100) * totalCourseMaxMarks;
  const neededEseWeighted = Math.max(0, requiredTotalMarks - totalCiaConvertedScore);

  let neededEsePaperMarks = 0;
  if (eseWeightage > 0 && eseConductedMax > 0) {
    neededEsePaperMarks = (neededEseWeighted / eseWeightage) * eseConductedMax;
  }

  // CHRIST 40% mandatory ESE pass rule on question paper
  const minMandatoryEsePaperMarks = 0.4 * eseConductedMax;
  const effectiveNeededEseMarks =
    eseWeightage > 0
      ? Math.max(minMandatoryEsePaperMarks, neededEsePaperMarks)
      : 0;

  const maxPossibleOverallMarks = totalCiaConvertedScore + Number(eseWeightage);
  const maxPossibleOverallPct =
    totalCourseMaxMarks > 0
      ? (maxPossibleOverallMarks / totalCourseMaxMarks) * 100
      : 0;

  const isPossible = effectiveNeededEseMarks <= eseConductedMax;

  let summaryMessage = "";
  if (eseWeightage === 0) {
    summaryMessage = `100% Practical Course: Final Scaled Internal Score is ${totalCiaConvertedScore.toFixed(1)} / ${totalCiaMaxWeightage}`;
  } else if (!isPossible) {
    summaryMessage = `Target requires more than maximum paper marks (${Math.ceil(effectiveNeededEseMarks)} / ${eseConductedMax}). Max achievable is ${maxPossibleOverallPct.toFixed(1)}%.`;
  } else if (neededEsePaperMarks < minMandatoryEsePaperMarks) {
    summaryMessage = `Must score at least ${Math.ceil(minMandatoryEsePaperMarks)} / ${eseConductedMax} (Christ University 40% minimum pass rule on question paper).`;
  } else {
    summaryMessage = `Need ${Math.ceil(effectiveNeededEseMarks)} / ${eseConductedMax} on ESE paper to secure ${goal.label.split(" ")[0]} (${targetGoalPct}%).`;
  }

  return {
    totalCiaConvertedScore,
    totalCiaMaxWeightage,
    totalCourseMaxMarks,
    targetGoalPct,
    requiredTotalMarks,
    neededEseWeighted,
    neededEsePaperMarks,
    minMandatoryEsePaperMarks,
    effectiveNeededEseMarks,
    isPossible,
    maxPossibleOverallMarks,
    maxPossibleOverallPct,
    summaryMessage,
  };
}
