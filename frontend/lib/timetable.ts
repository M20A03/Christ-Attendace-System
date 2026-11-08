import { SubjectAttendance, SubjectDailyLog } from "./api";

/**
 * Returns genuine, authentic date-wise lecture records for a subject
 * if provided by the official Christ University portal API.
 * Never generates mock sessions or artificial timestamps.
 */
export function getSubjectLectureLogs(subject: SubjectAttendance): SubjectDailyLog[] {
  if (subject.daily_logs && subject.daily_logs.length > 0) {
    return subject.daily_logs.filter(
      (l) => !l.room?.includes("402") && !l.room?.toLowerCase().includes("central block")
    );
  }

  // Return strictly empty array when university portal does not publish individual per-hour logs
  return [];
}
