"""
Client and parser for Christ University internal portal attendance and marks APIs.
"""
import os
import datetime
import logging
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger("portal")

PORTAL_API_BASE = os.getenv("PORTAL_API_BASE", "https://espro.christuniversity.in:84").rstrip("/")

from models import (
    AttendanceResponse,
    MarksResponse,
    StudentInfo,
    SubjectAttendance,
    TodayClass,
    SubjectMark,
    HostelBiometricInfo,
    HostelBiometricPunch,
)

# Empty attendance default when no portal records have been synced yet
def get_empty_attendance(student: StudentInfo) -> AttendanceResponse:
    """Return clean empty attendance indicating sync is required."""
    return AttendanceResponse(
        student=student,
        overall_attendance=0.0,
        subjects=[],
        today_classes=[],
        last_updated="Sync Required",
    )


def get_empty_marks(student: StudentInfo) -> MarksResponse:
    """Return clean empty marks response when no portal marks synced yet."""
    return MarksResponse(
        student=student,
        semester="Current",
        overall_gpa=0.0,
        marks=[],
    )


def _parse_num(val: Any) -> Optional[float]:
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        clean = val.replace("%", "").strip()
        if not clean:
            return None
        try:
            return float(clean)
        except ValueError:
            return None
    return None


def parse_portal_attendance_data(raw_data: Any, student: StudentInfo, overall_pct: Optional[float] = None) -> AttendanceResponse:
    """
    Parses dynamic portal response structures into standard AttendanceResponse.
    Supports all Christ University ESPro endpoints:
    - totalHoursAttended / totalHoursScheduled / totalPercentage (getCourseWiseAttendance)
    - courseTypeDetails breakdown (Theory / Practical)
    - withMedical / hoursHeld (KPServiceNew / getAttendanceCBCS)
    - overallPercentage / presentCount (getAttendanceCount)
    """
    import datetime

    # If raw_data is a dictionary wrapping subjects or data
    if isinstance(raw_data, dict):
        if "courseData" in raw_data:
            if not overall_pct and "countInfo" in raw_data:
                ci = raw_data["countInfo"]
                overall_pct = _parse_num(ci.get("overallPercentage") or ci.get("overall"))
            raw_data = raw_data["courseData"]
        elif "data" in raw_data and isinstance(raw_data["data"], (list, dict)):
            raw_data = raw_data["data"]

    attended_keys = [
        "totalHoursAttended",
        "classesAttended",
        "attendedClasses",
        "attendedHours",
        "attended",
        "presentCount",
        "present",
        "totalPresent",
        "withMedical",
        "withoutMedical",
        "subjectClassesAttended",
        "classes_attended",
        "hours_attended",
    ]

    scheduled_keys = [
        "totalHoursScheduled",
        "scheduledHours",
        "totalScheduled",
        "totalClasses",
        "totalConducted",
        "classesHeld",
        "conducted",
        "total",
        "totalCount",
        "hoursHeld",
        "subjectClassesHeld",
        "total_classes",
        "hours_scheduled",
    ]

    percentage_keys = [
        "totalPercentage",
        "percentage",
        "overallPercentage",
        "subjectClassesAttendedPercentage",
        "attendancePercentage",
        "percentageWithoutLeave",
        "percentageWithLeave",
    ]

    # Handle dictionary with subjects array
    if isinstance(raw_data, dict) and "subjects" in raw_data:
        raw_list = raw_data.get("subjects", [])
    elif isinstance(raw_data, list):
        # Check if list contains semester objects
        if raw_data and isinstance(raw_data[0], dict) and "subjects" in raw_data[0]:
            raw_list = raw_data[0].get("subjects", [])
        else:
            raw_list = raw_data
    else:
        raw_list = []

    if raw_list:
        subjects_list = []
        tot_att = 0
        tot_classes = 0
        for item in raw_list:
            if not isinstance(item, dict):
                continue
            name = (
                item.get("courseName")
                or item.get("subjectName")
                or item.get("courseTitle")
                or item.get("subject")
                or item.get("course")
                or item.get("name", "Course")
            )

            # 1. Attended
            att = None
            for k in attended_keys:
                val = _parse_num(item.get(k))
                if val is not None:
                    att = int(val)
                    break

            # 2. Scheduled / Total
            tot = None
            for k in scheduled_keys:
                val = _parse_num(item.get(k))
                if val is not None:
                    tot = int(val)
                    break

            # 3. Fallback: courseTypeDetails breakdown (Theory / Practical)
            if (att is None or att == 0) and (tot is None or tot == 0):
                details = item.get("courseTypeDetails")
                if isinstance(details, list) and details:
                    sum_att = 0
                    sum_tot = 0
                    found = False
                    for d in details:
                        if isinstance(d, dict):
                            d_att = None
                            d_tot = None
                            for k in attended_keys:
                                v = _parse_num(d.get(k))
                                if v is not None:
                                    d_att = int(v)
                                    break
                            for k in scheduled_keys:
                                v = _parse_num(d.get(k))
                                if v is not None:
                                    d_tot = int(v)
                                    break
                            if d_att is not None or d_tot is not None:
                                sum_att += (d_att or 0)
                                sum_tot += (d_tot or 0)
                                found = True
                    if found:
                        att = sum_att
                        tot = sum_tot

            # 4. Fallback: compound theory + practical
            if (att is None or att == 0) and (tot is None or tot == 0):
                if any(k in item for k in ("theoryAttended", "practicalAttended", "theoryConducted", "practicalConducted")):
                    att = int((_parse_num(item.get("theoryAttended")) or 0) + (_parse_num(item.get("practicalAttended")) or 0))
                    tot = int((_parse_num(item.get("theoryConducted")) or 0) + (_parse_num(item.get("practicalConducted")) or 0))

            final_att = att if att is not None else 0
            final_tot = tot if tot is not None else 0

            # 5. Percentage
            pct = None
            for k in percentage_keys:
                val = _parse_num(item.get(k))
                if val is not None:
                    pct = round(val, 1)
                    break
            if pct is None:
                pct = round((final_att / final_tot * 100), 1) if final_tot > 0 else 0.0

            tot_att += final_att
            tot_classes += final_tot
            subjects_list.append(
                SubjectAttendance(
                    name=name,
                    attended=final_att,
                    total=final_tot,
                    percentage=pct,
                    subject_code=item.get("courseCode") or item.get("subjectCode") or item.get("code"),
                    faculty=item.get("staffName") or item.get("facultyName") or item.get("teacherName") or item.get("faculty"),
                )
            )

        if overall_pct is not None:
            overall = round(float(overall_pct), 1)
        elif isinstance(raw_data, dict) and (raw_data.get("overall_attendance") or raw_data.get("overallPercentage")):
            overall = round(float(raw_data.get("overall_attendance") or raw_data.get("overallPercentage")), 1)
        else:
            overall = round((tot_att / tot_classes * 100), 1) if tot_classes > 0 else 0.0

        if subjects_list:
            return AttendanceResponse(
                student=student,
                overall_attendance=overall,
                subjects=subjects_list,
                today_classes=[],
                last_updated=datetime.datetime.now().strftime("%I:%M %p"),
            )

    # When no courses could be parsed, return clean empty state
    return get_empty_attendance(student)


async def fetch_student_attendance(access_token: str, student: StudentInfo) -> AttendanceResponse:
    """
    Calls Christ University internal ESPro APIs on port 84 to retrieve authentic live attendance.
    Supports both ClassRoomAttendanceServices and KPServiceNew based on student semester configuration.
    """
    if not access_token or access_token.startswith("demo_"):
        return get_empty_attendance(student)

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Origin": "https://cue.christuniversity.in",
        "Referer": "https://cue.christuniversity.in/",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0, verify=False) as client:
            # Step 1: Get student active semester sessions
            sem_url = f"{PORTAL_API_BASE}/ClassRoomAttendanceServices/Student/StudentAttendance/getStudentSemesters"
            logger.info("Calling CUE portal getStudentSemesters: %s", sem_url)
            sem_res = await client.post(sem_url, json={}, headers=headers)
            logger.info("getStudentSemesters status: %d, response body: %s", sem_res.status_code, sem_res.text)
            
            if sem_res.status_code == 200:
                sem_data = sem_res.json()
                sessions = sem_data if isinstance(sem_data, list) else sem_data.get("data", [])
                
                # Find current semester
                current_sess = None
                if isinstance(sessions, list) and sessions:
                    current_sess = next((s for s in sessions if isinstance(s, dict) and s.get("isCurrent")), sessions[0])
                
                if current_sess and isinstance(current_sess, dict):
                    session_id = current_sess.get("sessionId")
                    term_no = current_sess.get("termNumber") or current_sess.get("semester") or current_sess.get("termNo")
                    call_kp = current_sess.get("callKpServiceNew", False)

                    logger.info("Current semester: sessionId=%s, termNo=%s, callKpServiceNew=%s", session_id, term_no, call_kp)

                    overall_percentage = None

                    # If KPServiceNew is flagged for this program
                    if call_kp and term_no:
                        kp_term_url = f"{PORTAL_API_BASE}/KPServiceNew/rest/getAttendanceDetailsBySemester?termNo={term_no}"
                        kp_term_res = await client.post(kp_term_url, json={}, headers=headers)
                        if kp_term_res.status_code == 200:
                            logger.info("Successfully fetched attendance from KPServiceNew term URL")
                            return parse_portal_attendance_data(kp_term_res.json(), student)

                    if session_id:
                        # Step 2: Fetch overall attendance count
                        count_url = f"{PORTAL_API_BASE}/ClassRoomAttendanceServices/Student/StudentAttendance/getAttendanceCount?sessionId={session_id}"
                        count_res = await client.post(count_url, json={}, headers=headers)
                        if count_res.status_code == 200:
                            count_data = count_res.json()
                            overall_percentage = count_data.get("overallPercentage") or count_data.get("overall")

                        # Step 3: Fetch course-wise attendance
                        courses_url = f"{PORTAL_API_BASE}/ClassRoomAttendanceServices/Student/StudentAttendance/getCourseWiseAttendance?sessionId={session_id}"
                        courses_res = await client.post(courses_url, json={}, headers=headers)
                        if courses_res.status_code == 200:
                            courses_data = courses_res.json()
                            if courses_data:
                                logger.info("Successfully fetched course-wise attendance from ClassRoomAttendanceServices")
                                return parse_portal_attendance_data(courses_data, student, overall_percentage)

            # Step 4: Fallback to general KPServiceNew endpoints
            kp_urls = [
                f"{PORTAL_API_BASE}/KPServiceNew/rest/getAttendanceCBCS",
                f"{PORTAL_API_BASE}/KPServiceNew/rest/getAttendanceDetailsBySemester?termNo=1",
            ]
            for fallback_url in kp_urls:
                try:
                    fallback_res = await client.post(fallback_url, json={}, headers=headers)
                    logger.info("Fallback %s status: %d, body: %s", fallback_url, fallback_res.status_code, fallback_res.text[:200])
                    if fallback_res.status_code == 200 and fallback_res.json():
                        logger.info("Successfully fetched attendance from fallback: %s", fallback_url)
                        return parse_portal_attendance_data(fallback_res.json(), student)
                except Exception as fb_err:
                    logger.warning("Fallback %s failed: %s", fallback_url, fb_err)

    except Exception as e:
        logger.error("Exception fetching real attendance from portal: %s", e)

    return get_empty_attendance(student)


async def fetch_student_marks(access_token: str, student: StudentInfo) -> MarksResponse:
    """
    Calls Christ University internal ExamServices API to retrieve authentic live CIA marks.
    Flow:
      1. POST ExamServices/ExamCiaResultView/getStudentClasses
      2. Extract active classId
      3. POST ExamServices/ExamCiaResultView/getExamCiaResultView?classId={classId}
    """
    if not access_token or access_token.startswith("demo_"):
        return get_empty_marks(student)

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Origin": "https://cue.christuniversity.in",
        "Referer": "https://cue.christuniversity.in/",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
            classes_url = f"{PORTAL_API_BASE}/ExamServices/ExamCiaResultView/getStudentClasses"
            classes_res = await client.post(classes_url, json={}, headers=headers)
            if classes_res.status_code == 200:
                classes_data = classes_res.json()
                classes_list = classes_data if isinstance(classes_data, list) else classes_data.get("data", [])
                if classes_list:
                    class_id = classes_list[0].get("classId") or classes_list[0].get("id")
                    if class_id:
                        cia_url = f"{PORTAL_API_BASE}/ExamServices/ExamCiaResultView/getExamCiaResultView?classId={class_id}"
                        cia_res = await client.post(cia_url, json={}, headers=headers)
                        if cia_res.status_code == 200:
                            cia_json = cia_res.json()
                            items = cia_json if isinstance(cia_json, list) else cia_json.get("data", [])
                            if items:
                                marks = []
                                for it in items:
                                    marks.append(SubjectMark(
                                        subject_name=it.get("subjectName") or it.get("courseName") or "Course",
                                        subject_code=it.get("subjectCode") or it.get("courseCode") or "N/A",
                                        cia1=it.get("cia1"),
                                        cia2=it.get("cia2"),
                                        cia3=it.get("cia3"),
                                        total=it.get("totalMarks") or it.get("total"),
                                        max_marks=it.get("maxMarks", 100),
                                    ))
                                if marks:
                                    return MarksResponse(student=student, semester=classes_list[0].get("semesterName", "Current"), marks=marks)
    except Exception as e:
        logger.warning("Error fetching CIA marks from portal: %s", e)

    return get_empty_marks(student)


async def fetch_hostel_attendance(access_token: str) -> HostelBiometricInfo:
    """
    Checks if student is a hostelite via Christ University KPServiceNew biometric APIs.
    If is_valid == 1, fetches their biometric ID and punch history.
    If the student is not a hostelite (is_valid == 0), returns is_hostelite=False.
    """
    if not access_token or access_token.startswith("demo_"):
        return HostelBiometricInfo(is_hostelite=False)

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Origin": "https://cue.christuniversity.in",
        "Referer": "https://cue.christuniversity.in/",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0, verify=False) as client:
            # Step 1: Check if student has valid hostel biometric registration
            bio_id_url = f"{PORTAL_API_BASE}/KPServiceNew/rest/getHostelBiometricId"
            id_res = await client.post(bio_id_url, json={}, headers=headers)
            
            if id_res.status_code == 200:
                id_data = id_res.json()
                items = id_data if isinstance(id_data, list) else [id_data]
                if items and isinstance(items[0], dict):
                    first = items[0]
                    if first.get("is_valid") == 1 or first.get("is_hostelite"):
                        biometric_id = str(first.get("biometric_id") or first.get("biometricId") or "")
                        hostel_name = first.get("hostel_name") or first.get("hostelName") or "Christ University Hostel"
                        
                        # Step 2: Fetch detailed punches
                        det_url = f"{PORTAL_API_BASE}/KPServiceNew/rest/getHostelBiometricDetails"
                        det_res = await client.post(det_url, json={}, headers=headers)
                        punches = []
                        last_punch = None
                        if det_res.status_code == 200:
                            det_data = det_res.json()
                            det_list = det_data if isinstance(det_data, list) else det_data.get("data", [])
                            for p in det_list:
                                if isinstance(p, dict):
                                    punch = HostelBiometricPunch(
                                        date=str(p.get("date") or p.get("punchDate") or "Today"),
                                        punch_time=p.get("time") or p.get("punchTime"),
                                        punch_type=p.get("type") or p.get("punchType", "IN"),
                                        status=p.get("status", "Present"),
                                    )
                                    punches.append(punch)
                            if punches:
                                last_punch = f"{punches[0].date} at {punches[0].punch_time or ''}"

                        return HostelBiometricInfo(
                            is_hostelite=True,
                            biometric_id=biometric_id,
                            hostel_name=hostel_name,
                            last_punch=last_punch,
                            punches=punches,
                        )
    except Exception:
        pass

    return HostelBiometricInfo(is_hostelite=False)

