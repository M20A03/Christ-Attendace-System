"""
Pydantic data models for the Christ Attendance Viewer API.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class TokenExchangeRequest(BaseModel):
    code: str
    code_verifier: str
    redirect_uri: Optional[str] = None


class DirectTokenRequest(BaseModel):
    token: str


class StudentInfo(BaseModel):
    name: str
    reg_number: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user_id: str
    student: StudentInfo


class SubjectAttendance(BaseModel):
    name: str
    attended: int
    total: int
    percentage: float
    subject_code: Optional[str] = None
    faculty: Optional[str] = None


class TodayClass(BaseModel):
    subject: str
    time: str
    status: str  # "present", "absent", "not_marked"
    room: Optional[str] = None


class AttendanceResponse(BaseModel):
    student: StudentInfo
    overall_attendance: float
    subjects: List[SubjectAttendance]
    today_classes: List[TodayClass]
    last_updated: Optional[str] = None


class SubjectMark(BaseModel):
    subject: str
    cia1: Optional[float] = None
    cia2: Optional[float] = None
    cia3: Optional[float] = None
    attendance_marks: Optional[float] = None
    total: Optional[float] = None
    max_marks: Optional[float] = 100.0
    grade: Optional[str] = None


class MarksResponse(BaseModel):
    student: StudentInfo
    semester: Optional[str] = "Semester IV"
    overall_gpa: Optional[float] = None
    marks: List[SubjectMark]


class LogoutRequest(BaseModel):
    user_id: Optional[str] = None

