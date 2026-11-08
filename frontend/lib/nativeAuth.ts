import { Capacitor, registerPlugin } from '@capacitor/core';
import { setAuthSession, StudentInfo } from './auth';

export interface CUEAuthPluginInterface {
  openPortalLogin(): Promise<{
    success: boolean;
    raw_attendance?: string;
    profile?: string;
    token?: string;
  }>;
}

export const CUEAuth = registerPlugin<CUEAuthPluginInterface>('CUEAuth');

export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

export interface ParsedSubject {
  name: string;
  attended: number;
  total: number;
  percentage: number;
  subject_code?: string;
  faculty?: string;
}

export interface InterceptedAttendanceData {
  student: StudentInfo;
  overall_attendance: number;
  subjects: ParsedSubject[];
  today_classes: any[];
  last_updated: string;
}

function parseNumeric(val: any): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'string') {
    const clean = val.replace('%', '').trim();
    if (clean === '') return null;
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
  }
  return null;
}

/**
 * Parses raw JSON string intercepted from CUE portal into clean AttendanceData.
 * Comprehensive mapping for Christ University ESPro endpoints:
 * - totalHoursAttended / totalHoursScheduled / totalPercentage (getCourseWiseAttendance)
 * - courseTypeDetails breakdown (Theory / Practical)
 * - withMedical / hoursHeld (KPServiceNew / getAttendanceCBCS)
 * - overallPercentage / presentCount (getAttendanceCount)
 */
export function parseRawPortalAttendance(rawJson: string, student: StudentInfo): InterceptedAttendanceData | null {
  try {
    let parsed: any;
    try {
      parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    } catch {
      return null;
    }

    const countInfo = parsed?.countInfo || null;
    const dataToParse = parsed?.courseData || parsed;

    let list: any[] = [];
    if (Array.isArray(dataToParse)) {
      list = dataToParse;
    } else if (dataToParse && Array.isArray(dataToParse.data)) {
      list = dataToParse.data;
    } else if (dataToParse && typeof dataToParse === 'object') {
      if (Array.isArray(dataToParse.subjects)) {
        list = dataToParse.subjects;
      } else {
        const keys = Object.keys(dataToParse);
        for (const k of keys) {
          if (Array.isArray(dataToParse[k])) {
            list = dataToParse[k];
            break;
          }
        }
      }
    }

    if (!list || list.length === 0) return null;

    // Check if list contains semester objects containing subjects array (CBCS / KPServiceNew)
    if (list.length > 0 && Array.isArray(list[0]?.subjects)) {
      list = list[0].subjects;
    }

    let totAtt = 0;
    let totClasses = 0;
    const subjects: ParsedSubject[] = [];

    const attendedKeys = [
      'totalHoursAttended',
      'classesAttended',
      'attendedClasses',
      'attendedHours',
      'attended',
      'presentCount',
      'present',
      'totalPresent',
      'withMedical',
      'withoutMedical',
      'subjectClassesAttended',
      'classes_attended',
      'hours_attended',
    ];

    const scheduledKeys = [
      'totalHoursScheduled',
      'scheduledHours',
      'totalScheduled',
      'totalClasses',
      'totalConducted',
      'classesHeld',
      'conducted',
      'total',
      'totalCount',
      'hoursHeld',
      'subjectClassesHeld',
      'total_classes',
      'hours_scheduled',
    ];

    const percentageKeys = [
      'totalPercentage',
      'percentage',
      'overallPercentage',
      'subjectClassesAttendedPercentage',
      'attendancePercentage',
      'percentageWithoutLeave',
      'percentageWithLeave',
    ];

    for (const c of list) {
      if (!c || typeof c !== 'object') continue;
      const name = c.courseName || c.subjectName || c.courseTitle || c.subject || c.course || c.name || 'Course';

      // 1. Resolve attended classes
      let att: number | null = null;
      for (const k of attendedKeys) {
        const val = parseNumeric(c[k]);
        if (val !== null) {
          att = val;
          break;
        }
      }

      // 2. Resolve scheduled / conducted total classes
      let tot: number | null = null;
      for (const k of scheduledKeys) {
        const val = parseNumeric(c[k]);
        if (val !== null) {
          tot = val;
          break;
        }
      }

      // 3. Fallback: courseTypeDetails breakdown (Theory / Practical)
      if ((att === null || att === 0) && (tot === null || tot === 0) && Array.isArray(c.courseTypeDetails) && c.courseTypeDetails.length > 0) {
        let sumAtt = 0;
        let sumTot = 0;
        let found = false;
        for (const d of c.courseTypeDetails) {
          if (!d || typeof d !== 'object') continue;
          let dAtt: number | null = null;
          let dTot: number | null = null;
          for (const k of attendedKeys) {
            const v = parseNumeric(d[k]);
            if (v !== null) { dAtt = v; break; }
          }
          for (const k of scheduledKeys) {
            const v = parseNumeric(d[k]);
            if (v !== null) { dTot = v; break; }
          }
          if (dTot !== null || dAtt !== null) {
            sumAtt += (dAtt || 0);
            sumTot += (dTot || 0);
            found = true;
          }
        }
        if (found) {
          att = sumAtt;
          tot = sumTot;
        }
      }

      // 4. Fallback: Theory + Practical compound
      if ((att === null || att === 0) && (tot === null || tot === 0)) {
        if (c.theoryAttended !== undefined || c.practicalAttended !== undefined || c.theoryConducted !== undefined || c.practicalConducted !== undefined) {
          att = (parseNumeric(c.theoryAttended) || 0) + (parseNumeric(c.practicalAttended) || 0);
          tot = (parseNumeric(c.theoryConducted) || 0) + (parseNumeric(c.practicalConducted) || 0);
        }
      }

      const finalAtt = att !== null ? att : 0;
      const finalTot = tot !== null ? tot : 0;

      // 5. Resolve percentage
      let pct: number | null = null;
      for (const k of percentageKeys) {
        const val = parseNumeric(c[k]);
        if (val !== null) {
          pct = Math.round(val * 10) / 10;
          break;
        }
      }
      if (pct === null) {
        pct = finalTot > 0 ? Math.round((finalAtt / finalTot) * 1000) / 10 : 0.0;
      }

      totAtt += finalAtt;
      totClasses += finalTot;

      subjects.push({
        name,
        attended: finalAtt,
        total: finalTot,
        percentage: pct,
        subject_code: c.courseCode || c.subjectCode || c.code || '',
        faculty: c.staffName || c.facultyName || c.teacherName || c.faculty || '',
      });
    }

    if (subjects.length === 0) return null;

    let overall: number | null = null;
    if (countInfo) {
      const overallVal = parseNumeric(countInfo.overallPercentage || countInfo.overall);
      if (overallVal !== null) overall = Math.round(overallVal * 10) / 10;
    }
    if (overall === null && (parsed.overallPercentage || parsed.overall)) {
      const overallVal = parseNumeric(parsed.overallPercentage || parsed.overall);
      if (overallVal !== null) overall = Math.round(overallVal * 10) / 10;
    }
    if (overall === null) {
      overall = totClasses > 0 ? Math.round((totAtt / totClasses) * 1000) / 10 : 0.0;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      student,
      overall_attendance: overall,
      subjects,
      today_classes: [],
      last_updated: timeStr,
    };
  } catch (e) {
    console.error('Error parsing raw portal attendance:', e);
    return null;
  }
}

/**
 * Triggers the native in-app login window loading https://cue.christuniversity.in.
 * As soon as the user logs in, the injected hook intercepts the real attendance payload
 * returned by the portal, stores it locally, and redirects to dashboard.
 */
export async function startNativePortalLogin(): Promise<{ success: boolean; error?: string }> {
  if (!isNativeApp()) {
    return { success: false, error: 'Not running in native app' };
  }

  try {
    const res = await CUEAuth.openPortalLogin();
    if (!res || !res.success) {
      return { success: false, error: 'Login cancelled' };
    }

    // Extract student profile
    let studentName = 'Christ Student';
    let regNo = 'Student';

    if (res.profile) {
      try {
        const prof = JSON.parse(res.profile);
        const pObj = prof.profile || prof;
        studentName = pObj.name || pObj.given_name || studentName;
        regNo = pObj.preferred_username || pObj.username || pObj.email || regNo;
      } catch {}
    }

    const studentInfo: StudentInfo = {
      name: studentName,
      reg_number: regNo,
    };

    const token = res.token || 'cue_native_token';
    const userId = `student_${regNo}`;

    // Set 30-day session
    setAuthSession(token, userId, studentInfo, 2592000);

    // If raw attendance was intercepted, parse and cache it immediately
    if (res.raw_attendance) {
      // Check for intercepted hostel biometric data
      try {
        const rawObj = JSON.parse(res.raw_attendance);
        if (rawObj && rawObj.hostelData && typeof window !== 'undefined') {
          const hd = rawObj.hostelData;
          const items = Array.isArray(hd) ? hd : (hd.data || [hd]);
          if (items.length > 0) {
            const first = items[0];
            if (first.is_valid === 1 || first.is_hostelite) {
              const hostelInfo = {
                is_hostelite: true,
                biometric_id: String(first.biometric_id || first.biometricId || ''),
                hostel_name: first.hostel_name || first.hostelName || 'Christ University Student Hostel',
                last_punch: first.last_punch || undefined,
                punches: Array.isArray(first.punches) ? first.punches : []
              };
              localStorage.setItem('cu_cached_hostel', JSON.stringify(hostelInfo));
            }
          }
        }
      } catch {}

      const attendanceData = parseRawPortalAttendance(res.raw_attendance, studentInfo);
      if (attendanceData && attendanceData.subjects.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('cu_cached_attendance', JSON.stringify(attendanceData));
        }

        // Also sync to backend for cross-device backup
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-5f08.up.railway.app';
          await fetch(`${apiBase}/attendance/save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-User-Id': userId,
            },
            body: JSON.stringify(attendanceData),
          });
        } catch (syncErr) {
          console.warn('Backend attendance sync failed (local copy intact):', syncErr);
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    if (typeof err === 'string' && err.includes('cancelled')) {
      return { success: false, error: 'Login cancelled' };
    }
    return { success: false, error: err?.message || 'Login failed' };
  }
}
