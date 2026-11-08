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

/**
 * Parses raw JSON string intercepted from CUE portal into clean AttendanceData.
 */
export function parseRawPortalAttendance(rawJson: string, student: StudentInfo): InterceptedAttendanceData | null {
  try {
    let list: any[] = [];
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed)) {
      list = parsed;
    } else if (parsed && Array.isArray(parsed.data)) {
      list = parsed.data;
    } else if (parsed && typeof parsed === 'object') {
      const keys = Object.keys(parsed);
      for (const k of keys) {
        if (Array.isArray(parsed[k])) {
          list = parsed[k];
          break;
        }
      }
    }

    if (!list || list.length === 0) return null;

    let totAtt = 0;
    let totClasses = 0;
    const subjects: ParsedSubject[] = [];

    for (const c of list) {
      if (!c || typeof c !== 'object') continue;
      const name = c.courseName || c.subjectName || c.subject || c.name || 'Course';
      const att = Number(c.classesAttended || c.attendedClasses || c.attended || c.presentCount || c.present || 0);
      const tot = Number(c.totalClasses || c.totalConducted || c.total || c.totalCount || 0);

      let pct = 0;
      if (c.percentage !== undefined && c.percentage !== null) {
        pct = Number(c.percentage);
      } else if (c.overallPercentage !== undefined && c.overallPercentage !== null) {
        pct = Number(c.overallPercentage);
      } else {
        pct = tot > 0 ? Math.round((att / tot) * 1000) / 10 : 0.0;
      }

      totAtt += att;
      totClasses += tot;

      subjects.push({
        name,
        attended: att,
        total: tot,
        percentage: pct,
        subject_code: c.courseCode || c.subjectCode || '',
        faculty: c.staffName || c.facultyName || c.faculty || '',
      });
    }

    if (subjects.length === 0) return null;

    const overall = totClasses > 0 ? Math.round((totAtt / totClasses) * 1000) / 10 : 0.0;
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
