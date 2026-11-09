/**
 * Official Attendance and Hostel Turnstile Live Sync Schedule
 * Calibrated precisely to class attendance marking periods and campus gate entry windows.
 */

/**
 * Attendance Live Window:
 * - 7:30 AM, 8:30 AM, 9:30 AM (first 15 minutes of each: 7:30-7:45, 8:30-8:45, 9:30-9:45)
 * - 10:00 AM, 11:00 AM, 12:00 PM, 1:00 PM, 2:00 PM, 3:00 PM, 4:00 PM, 5:00 PM (first 15 minutes of each hour: :00 to :15)
 * Interval: Every 15 seconds when app is open.
 */
export function isAttendanceSyncWindow(now: Date = new Date()): boolean {
  const hour = now.getHours();
  const min = now.getMinutes();

  // Half-hour slots: 7:30-7:45, 8:30-8:45, 9:30-9:45
  if ((hour === 7 || hour === 8 || hour === 9) && min >= 30 && min < 45) {
    return true;
  }

  // Hourly slots: 10:00 to 17:00 (10 AM to 5 PM), first 15 mins of hour (00-14)
  if (hour >= 10 && hour <= 17 && min >= 0 && min < 15) {
    return true;
  }

  return false;
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
