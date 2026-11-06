/**
 * Attendance calculation formulas according to Christ University regulations:
 * Target attendance is typically 85% (0.85).
 */

export interface AttendanceMathResult {
  percentage: number;
  classesNeeded: number;
  safeSkips: number;
  status: "safe" | "warning" | "danger";
  message: string;
}

/**
 * Calculates attendance metrics for a given subject or overall total.
 * @param attended Classes attended
 * @param total Total classes conducted
 * @param target Target threshold as fraction (default: 0.85 for 85%)
 */
export function calculateAttendanceMetrics(
  attended: number,
  total: number,
  target: number = 0.85
): AttendanceMathResult {
  if (total <= 0) {
    return {
      percentage: 100,
      classesNeeded: 0,
      safeSkips: 0,
      status: "safe",
      message: "No classes conducted yet",
    };
  }

  const percentage = Math.round((attended / total) * 1000) / 10; // 1 decimal place

  // classes needed to reach target:
  // need = max(0, ceil((target * total - attended) / (1 - target)))
  let classesNeeded = 0;
  if (target < 1.0) {
    classesNeeded = Math.max(0, Math.ceil((target * total - attended) / (1 - target)));
  }

  // safe skips:
  // can_skip = max(0, floor((attended - target * total) / target))
  let safeSkips = 0;
  if (target > 0) {
    safeSkips = Math.max(0, Math.floor((attended - target * total) / target));
  }

  let status: "safe" | "warning" | "danger" = "safe";
  if (percentage >= 85) {
    status = "safe";
  } else if (percentage >= 75) {
    status = "warning";
  } else {
    status = "danger";
  }

  let message = "";
  if (percentage >= target * 100) {
    if (safeSkips === 0) {
      message = "On borderline — do not skip";
    } else {
      message = `Can skip ${safeSkips} class${safeSkips === 1 ? "" : "es"}`;
    }
  } else {
    message = `Need ${classesNeeded} more class${classesNeeded === 1 ? "" : "es"}`;
  }

  return {
    percentage,
    classesNeeded,
    safeSkips,
    status,
    message,
  };
}

/**
 * Simulates future attendance if student attends X more classes or misses Y classes.
 */
export function simulateAttendance(
  attended: number,
  total: number,
  additionalAttended: number,
  additionalMissed: number
): number {
  const newAttended = attended + additionalAttended;
  const newTotal = total + additionalAttended + additionalMissed;
  if (newTotal <= 0) return 100;
  return Math.round((newAttended / newTotal) * 1000) / 10;
}

