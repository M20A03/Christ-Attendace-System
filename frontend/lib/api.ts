/**
 * API client to communicate with the FastAPI backend.
 */
import { getAuthSession, setAuthSession, clearAuthSession, StudentInfo } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SubjectAttendance {
  name: string;
  attended: number;
  total: number;
  percentage: number;
  subject_code?: string;
  faculty?: string;
}

export interface TodayClass {
  subject: string;
  time: string;
  status: "present" | "absent" | "not_marked" | string;
  room?: string;
}

export interface AttendanceData {
  student: StudentInfo;
  overall_attendance: number;
  subjects: SubjectAttendance[];
  today_classes: TodayClass[];
  last_updated?: string;
}

export interface SubjectMark {
  subject: string;
  cia1?: number;
  cia2?: number;
  cia3?: number;
  attendance_marks?: number;
  total?: number;
  max_marks?: number;
  grade?: string;
}

export interface MarksData {
  student: StudentInfo;
  semester?: string;
  overall_gpa?: number;
  marks: SubjectMark[];
}

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = getAuthSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (session.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }
  if (session.userId) {
    headers["X-User-Id"] = session.userId;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError(
      "Unable to connect to Christ Attendance server. Please check your network.",
      0
    );
  }

  if (response.status === 401) {
    clearAuthSession();
    if (typeof window !== "undefined") {
      window.location.href = "/?expired=true";
    }
    throw new ApiError("Session expired — please log in again", 401);
  }

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }
    throw new ApiError(errorDetail, response.status);
  }

  return response.json();
}

/**
 * Exchange OAuth PKCE authorization code for access tokens and user profile
 */
export async function exchangeAuthCode(
  code: string,
  codeVerifier: string,
  redirectUri?: string
) {
  const data = await request<{
    access_token: string;
    token_type: string;
    expires_in: number;
    user_id: string;
    student: StudentInfo;
  }>("/auth/exchange", {
    method: "POST",
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  setAuthSession(data.access_token, data.user_id, data.student, data.expires_in);
  return data;
}

/**
 * Direct login with active Christ ESPRO/CUE access token
 */
export async function loginWithEsproToken(token: string) {
  const data = await request<{
    access_token: string;
    token_type: string;
    expires_in: number;
    user_id: string;
    student: StudentInfo;
  }>("/auth/direct-token", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

  setAuthSession(data.access_token, data.user_id, data.student, data.expires_in);
  return data;
}

/**
 * Direct login with Student Register Number / Email & Password
 * Single sign-on for mobile phones with persistent device storage.
 */
export async function loginWithCredentials(
  username: string,
  password: string,
  name?: string,
  rememberMe: boolean = true
) {
  const data = await request<{
    access_token: string;
    token_type: string;
    expires_in: number;
    user_id: string;
    student: StudentInfo;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
      name,
      remember_me: rememberMe,
    }),
  });

  setAuthSession(data.access_token, data.user_id, data.student, data.expires_in);
  return data;
}

/**
 * Fetch attendance data on demand.
 * First checks locally cached real attendance from WebView interception.
 * If not found or on refresh, queries the backend.
 */
export async function fetchAttendance(): Promise<AttendanceData> {
  const session = getAuthSession();

  // 1. Check if we have locally cached authentic attendance from WebView interception
  if (typeof window !== "undefined") {
    try {
      const localCached = localStorage.getItem("cu_cached_attendance");
      if (localCached) {
        const parsed: AttendanceData = JSON.parse(localCached);
        if (parsed && parsed.subjects && parsed.subjects.length > 0) {
          if (session.student) {
            parsed.student = session.student;
          }
          return parsed;
        }
      }
    } catch {}
  }

  // 2. Query backend
  const res = await request<AttendanceData>("/attendance", { method: "GET" });
  if (res && res.subjects && res.subjects.length > 0 && typeof window !== "undefined") {
    try {
      localStorage.setItem("cu_cached_attendance", JSON.stringify(res));
    } catch {}
  }
  return res;
}

export interface HostelPunch {
  date: string;
  punch_time?: string;
  punch_type?: string;
  device_name?: string;
  status?: string;
}

export interface HostelBiometricInfo {
  is_hostelite: boolean;
  biometric_id?: string;
  hostel_name?: string;
  room_no?: string;
  block_name?: string;
  last_punch?: string;
  curfew_status?: "inside" | "outside" | "late";
  punches?: HostelPunch[];
}

/**
 * Fetch marks breakdown
 */
export async function fetchMarks(): Promise<MarksData> {
  return request<MarksData>("/marks", { method: "GET" });
}

/**
 * Fetch hostel biometric attendance (only for hostel students)
 * Checks local cache first, then queries backend.
 */
export async function fetchHostelAttendance(): Promise<HostelBiometricInfo> {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("cu_cached_hostel");
      if (cached) {
        const parsed: HostelBiometricInfo = JSON.parse(cached);
        if (parsed && typeof parsed.is_hostelite === "boolean") {
          return parsed;
        }
      }
    } catch {}
  }

  try {
    const res = await request<HostelBiometricInfo>("/hostel-attendance", { method: "GET" });
    if (res && typeof window !== "undefined") {
      try {
        localStorage.setItem("cu_cached_hostel", JSON.stringify(res));
      } catch {}
    }
    return res;
  } catch {
    return { is_hostelite: false };
  }
}

/**
 * Log out and invalidate server session
 */
export async function logoutUser() {
  const session = getAuthSession();
  try {
    await request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ user_id: session.userId }),
    });
  } catch {
    // Silent fail on logout network issues
  } finally {
    clearAuthSession();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }
}

