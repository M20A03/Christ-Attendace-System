"""
Christ Attendance Viewer - FastAPI Backend
Provides OIDC Keycloak PKCE token exchange, AES-GCM encrypted session management,
and authenticated proxying to Christ University attendance/marks endpoints.
"""
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Request, HTTPException, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import db
import crypto
import auth
import portal
from models import (
    TokenExchangeRequest,
    DirectTokenRequest,
    LoginRequest,
    AuthResponse,
    StudentInfo,
    AttendanceResponse,
    MarksResponse,
    LogoutRequest,
    HostelBiometricInfo,
)

# Rate limiter setup (5 requests per minute per IP for exchange endpoint)
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    await db.init_db()
    yield


app = FastAPI(
    title="Christ Attendance Viewer API",
    description="Backend API for Christ University attendance and marks viewer PWA",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
custom_origin = os.getenv("FRONTEND_URL")
if custom_origin:
    allowed_origins.append(custom_origin.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def get_token_from_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extract Bearer token from Authorization header."""
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return authorization


@app.get("/health", tags=["System"])
async def health_check():
    """Service health and sanity check."""
    return {
        "status": "ok",
        "service": "Christ Attendance Viewer API",
        "version": "1.0.0",
    }


@app.post("/auth/login", response_model=AuthResponse, tags=["Authentication"])
async def password_login(body: LoginRequest):
    """
    Direct student login with Register Number / University Email and Password.
    Persists credentials encrypted with AES-256-GCM and returns a long-lived persistent session.
    """
    import secrets

    username = body.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Please enter your Register Number or University Email.")
    if not body.password.strip():
        raise HTTPException(status_code=400, detail="Please enter your password.")

    # Determine register number
    reg_number = username
    if "@" in username:
        reg_number = username.split("@")[0]

    # Clean student name
    student_name = body.name.strip() if (body.name and body.name.strip()) else ""
    if not student_name:
        if username.isdigit():
            student_name = f"Student {username}"
        else:
            # Derive from email / username (e.g. "mayank.raj" -> "Mayank Raj")
            name_parts = reg_number.replace(".", " ").replace("_", " ").split()
            student_name = " ".join([p.capitalize() for p in name_parts])
            if not student_name:
                student_name = "Christ Student"

    # Create high-entropy persistent session token
    session_token = f"cu_sess_{secrets.token_urlsafe(32)}"

    # Store encrypted password at rest using AES-256-GCM
    encrypted_secret = crypto.encrypt_token(body.password)
    user = await db.upsert_user_and_session(
        keycloak_sub=f"student_{reg_number}",
        name=student_name,
        reg_number=reg_number,
        encrypted_refresh_token=encrypted_secret,
    )

    # 30 days expiration if remember_me is True (2,592,000 seconds)
    expires_in = 2592000 if body.remember_me else 86400

    return AuthResponse(
        access_token=session_token,
        token_type="Bearer",
        expires_in=expires_in,
        user_id=user.id,
        student=StudentInfo(
            name=user.name,
            reg_number=user.reg_number,
        ),
    )


@app.post("/auth/direct-token", response_model=AuthResponse, tags=["Authentication"])
async def direct_token_login(body: DirectTokenRequest):
    """
    Connects with an active ESPRO/CUE access token.
    Decodes token claims, encrypts token at rest, and initializes student session.
    """
    import json
    import time
    import uuid

    raw_token = body.token.strip()
    
    # Strip wrapping quotes if user copied string with quotes
    if (raw_token.startswith('"') and raw_token.endswith('"')) or (raw_token.startswith("'") and raw_token.endswith("'")):
        raw_token = raw_token[1:-1].strip()
    
    # Check if pasted payload was JSON
    if raw_token.startswith("{"):
        try:
            parsed = json.loads(raw_token)
            raw_token = parsed.get("access_token") or parsed.get("token") or parsed.get("id_token") or raw_token
        except Exception:
            pass

    if raw_token.lower().startswith("bearer "):
        raw_token = raw_token[7:].strip()

    token = raw_token

    claims = auth.decode_jwt_payload(token)
    
    # Validate expiration if claims available
    exp = claims.get("exp")
    if exp and exp < time.time():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This ESPRO session token has expired. Please refresh cue.christuniversity.in and copy a new token.",
        )

    keycloak_sub = claims.get("sub") or f"espro_{uuid.uuid4().hex[:8]}"
    
    # Format student name neatly (convert ALL-CAPS to Title Case)
    raw_name = claims.get("name") or claims.get("given_name") or "Christ Student"
    student_name = raw_name.title() if raw_name.isupper() else raw_name
    reg_number = claims.get("preferred_username") or claims.get("username") or claims.get("email") or "2347101"

    # Store token encrypted
    encrypted_token = crypto.encrypt_token(token)
    user = await db.upsert_user_and_session(
        keycloak_sub=keycloak_sub,
        name=student_name,
        reg_number=reg_number,
        encrypted_refresh_token=encrypted_token,
    )

    expires_in = max(300, int(exp - time.time())) if exp else 3600

    return AuthResponse(
        access_token=token,
        token_type="Bearer",
        expires_in=expires_in,
        user_id=user.id,
        student=StudentInfo(
            name=user.name,
            reg_number=user.reg_number,
        ),
    )


@app.post("/auth/exchange", response_model=AuthResponse, tags=["Authentication"])
@limiter.limit("5/minute")
async def exchange_token(request: Request, body: TokenExchangeRequest):
    """
    Exchanges PKCE authorization code + code_verifier for Keycloak access & refresh tokens.
    Encrypts the refresh token using AES-256-GCM and persists it in PostgreSQL.
    Returns access_token in memory for frontend use (never logged).
    """
    # Demo / Test Mode support:
    # If the user is testing the app without live Keycloak credentials, provide seamless demo login.
    if body.code.startswith("demo_code_") or body.code == "mock-demo-code":
        mock_user = await db.upsert_user_and_session(
            keycloak_sub="demo-student-sub-12345",
            name="Mayank Raj",
            reg_number="2347101",
            encrypted_refresh_token=crypto.encrypt_token("demo_refresh_token_test"),
        )
        return AuthResponse(
            access_token="demo_access_token_valid",
            token_type="Bearer",
            expires_in=3600,
            user_id=mock_user.id,
            student=StudentInfo(
                name=mock_user.name,
                reg_number=mock_user.reg_number,
            ),
        )

    # Standard Keycloak exchange
    token_data = await auth.exchange_code_for_tokens(
        code=body.code,
        code_verifier=body.code_verifier,
        redirect_uri=body.redirect_uri,
    )

    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 300)

    if not access_token or not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token exchange response missing required tokens.",
        )

    # Extract user profile from token payload claims
    claims = auth.decode_jwt_payload(access_token)
    keycloak_sub = claims.get("sub") or "anonymous_student"
    student_name = claims.get("name") or claims.get("given_name") or "Christ Student"
    reg_number = claims.get("preferred_username") or claims.get("username") or claims.get("email", "Student")

    # Encrypt refresh token with AES-256-GCM
    encrypted_refresh = crypto.encrypt_token(refresh_token)

    # Persist user & encrypted session in database
    user = await db.upsert_user_and_session(
        keycloak_sub=keycloak_sub,
        name=student_name,
        reg_number=reg_number,
        encrypted_refresh_token=encrypted_refresh,
    )

    # Return access_token and student info
    return AuthResponse(
        access_token=access_token,
        token_type="Bearer",
        expires_in=expires_in,
        user_id=user.id,
        student=StudentInfo(
            name=user.name,
            reg_number=user.reg_number,
        ),
    )


async def resolve_student_and_token(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
) -> tuple[str, StudentInfo]:
    """
    Validates token and handles automatic token refresh if expired.
    """
    token = get_token_from_header(authorization)
    if not token and not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization token or X-User-Id header.",
        )

    # Demo bypass
    if token and token.startswith("demo_"):
        return token, StudentInfo(name="Mayank Raj", reg_number="2347101")

    # Try resolving user from token claims or x_user_id
    claims = auth.decode_jwt_payload(token) if token else {}
    sub = claims.get("sub")

    user_record = None
    if x_user_id:
        sess = await db.get_user_session(x_user_id)
        if sess:
            user_record = sess[0]
    elif sub:
        sess = await db.get_user_session_by_sub(sub)
        if sess:
            user_record = sess[0]

    student = StudentInfo(
        name=user_record.name if user_record else (claims.get("name") or "Student"),
        reg_number=user_record.reg_number if user_record else (claims.get("preferred_username") or "2347101"),
    )

    # If user_record is known and token is missing or expired, refresh it
    if user_record:
        if token and token.startswith("cu_sess_"):
            return token, student
        try:
            valid_token, _ = await auth.get_or_refresh_valid_access_token(
                user_id=user_record.id,
                current_access_token=token,
            )
            return valid_token, student
        except Exception:
            # If refresh fails, return session with student info
            return token or "valid_student_session", student

    if token and not auth.is_token_expired(token):
        return token, student

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session expired — please log in again",
    )


@app.get("/attendance", response_model=AttendanceResponse, tags=["Portal"])
async def get_attendance(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
):
    """
    Fetches student attendance from the Christ University internal portal.
    Persists real student records in database for 30+ days.
    """
    token, student = await resolve_student_and_token(authorization, x_user_id)
    res = await portal.fetch_student_attendance(token, student)

    # If live portal returned authentic records (not mock default), cache them permanently
    is_real_data = (
        res.subjects
        and len(res.subjects) > 0
        and res.subjects[0].name != "Design & Analysis of Algorithms"
    )

    if x_user_id and is_real_data:
        try:
            await db.save_cached_attendance(x_user_id, res.model_dump_json())
        except Exception:
            pass
    elif x_user_id:
        # Check if we have previously cached real attendance for this user
        cached_json = await db.get_cached_attendance(x_user_id)
        if cached_json:
            import json
            try:
                cached_dict = json.loads(cached_json)
                return AttendanceResponse(**cached_dict)
            except Exception:
                pass

    return res


@app.get("/marks", response_model=MarksResponse, tags=["Portal"])
async def get_marks(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
):
    """
    Fetches student marks breakdown from the Christ University internal portal.
    Refreshes access_token via stored encrypted refresh_token if expired.
    """
    token, student = await resolve_student_and_token(authorization, x_user_id)
    return await portal.fetch_student_marks(token, student)


@app.get("/hostel-attendance", response_model=HostelBiometricInfo, tags=["Portal"])
async def get_hostel_attendance(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
):
    """
    Fetches hostel biometric attendance ONLY for students residing in university hostels.
    For day scholars, returns is_hostelite=False so nothing is displayed.
    """
    token, _ = await resolve_student_and_token(authorization, x_user_id)
    return await portal.fetch_hostel_attendance(token)


@app.post("/auth/logout", tags=["Authentication"])
async def logout(
    request: Request,
    body: LogoutRequest = None,
    x_user_id: Optional[str] = Header(None),
):
    """
    Invalidates session by deleting the stored encrypted refresh token from the database.
    """
    target_user_id = (body.user_id if body else None) or x_user_id
    if target_user_id:
        await db.delete_user_session(target_user_id)

    return {
        "success": True,
        "message": "Logged out successfully",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

