/**
 * Official Attendance and Hostel Turnstile Live Sync Schedule
 * Calibrated precisely to class attendance marking periods and campus gate entry windows.
 * Includes intelligent rate-limiting and anti-flagging protections.
 */

/**
 * Attendance Live Window:
 * - Morning half-hour slots: 7:30-7:45 AM, 8:30-8:45 AM, 9:30-9:45 AM
 * - Regular class hours: 9:00-9:15 AM, 10:00-10:15 AM, 11:00-11:15 AM, 12:00-12:15 PM,
 *   1:00-1:15 PM, 2:00-2:15 PM, 3:00-3:15 PM, 4:00-4:15 PM, 5:00-5:15 PM
 */
export function isAttendanceSyncWindow(now: Date = new Date()): boolean {
  const hour = now.getHours();
  const min = now.getMinutes();

  // Half-hour slots: 7:30-7:45, 8:30-8:45, 9:30-9:45
  if ((hour === 7 || hour === 8 || hour === 9) && min >= 30 && min < 45) {
    return true;
  }

  // Hourly slots: 9:00 AM to 5:00 PM (first 15 minutes of each hour: :00 to :14)
  if (hour >= 9 && hour <= 17 && min >= 0 && min < 15) {
    return true;
  }

  return false;
}

/**
 * Unique identifier for the current 15-minute attendance window.
 * Used to cap the maximum number of requests per window to avoid flagging if a student forgets their phone open.
 */
export function getAttendanceWindowKey(now: Date = new Date()): string | null {
  if (!isAttendanceSyncWindow(now)) return null;
  const hour = now.getHours();
  const min = now.getMinutes();
  const slot = min >= 30 ? "30" : "00";
  return `${now.toDateString()}-${hour}:${slot}`;
}

/**
 * Maximum requests per 15-minute window if user leaves phone open and unattended.
 * 12 requests in 15 minutes = ~0.8 requests/min (completely natural and 100% safe from firewall flags).
 */
export const MAX_AUTO_SYNC_PER_WINDOW = 12;

/**
 * Adaptive interval:
 * - First 4 checks: every 15 seconds (catches quick attendance submission)
 * - Next 4 checks: every 30 seconds
 * - Remaining checks: every 60 seconds
 * If attendance updates during the window, polling stops until next lecture.
 */
export function getAdaptiveSyncInterval(syncCountInWindow: number): number {
  if (syncCountInWindow < 4) return 15000; // 15 seconds
  if (syncCountInWindow < 8) return 30000; // 30 seconds
  return 60000; // 60 seconds
}

/**
 * Hostel Turnstile Biometric Live Window:
 * - Morning: 7:00 AM to 10:00 AM
 * - Night: 8:30 PM to 9:30 PM (20:30 to 21:30)
 * Interval: Every 10 seconds when app is open.
 */
export function isHostelSyncWindow(now: Date = new Date()): boolean {
  const hour = now.getHours();
  const min = now.getMinutes();

  // Morning window: 7:00 AM to 10:00 AM (07:00 - 09:59)
  if (hour >= 7 && hour < 10) {
    return true;
  }

  // Night curfew window: 8:30 PM to 9:30 PM (20:30 to 21:30)
  if (hour === 20 && min >= 30) {
    return true;
  }
  if (hour === 21 && min < 30) {
    return true;
  }

  return false;
}
