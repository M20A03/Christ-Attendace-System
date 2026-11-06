"""
Keycloak OIDC authentication and token exchange handler with PKCE.
"""
import os
import json
import base64
import time
from typing import Dict, Any, Tuple
import httpx
from fastapi import HTTPException, status
from crypto import encrypt_token, decrypt_token
import db

KEYCLOAK_BASE_URL = os.getenv("KEYCLOAK_BASE_URL", "https://studentespro.christuniversity.in")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "Student")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "react-app")
KEYCLOAK_REDIRECT_URI = os.getenv("KEYCLOAK_REDIRECT_URI", "http://localhost:3000/callback")

TOKEN_ENDPOINT = f"{KEYCLOAK_BASE_URL}/auth/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"


def decode_jwt_payload(token: str) -> Dict[str, Any]:
    """
    Decodes the unverified JWT payload claims.
    Tokens obtained directly over TLS from Keycloak token endpoint are authentic.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return {}
        payload_b64 = parts[1]
        # Adjust base64 padding
        remainder = len(payload_b64) % 4
        if remainder:
            payload_b64 += "=" * (4 - remainder)
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        return json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return {}


def is_token_expired(token: str, margin_seconds: int = 30) -> bool:
    """
    Check if a JWT access token is expired or close to expiring (within margin).
    """
    payload = decode_jwt_payload(token)
    exp = payload.get("exp")
    if not exp:
        return True
    return time.time() >= (exp - margin_seconds)


async def exchange_code_for_tokens(code: str, code_verifier: str, redirect_uri: str = None) -> Dict[str, Any]:
    """
    Exchange authorization code + PKCE code_verifier for access and refresh tokens.
    """
    actual_redirect_uri = redirect_uri or KEYCLOAK_REDIRECT_URI

    payload = {
        "grant_type": "authorization_code",
        "client_id": KEYCLOAK_CLIENT_ID,
        "code": code,
        "code_verifier": code_verifier,
        "redirect_uri": actual_redirect_uri,
    }

    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(TOKEN_ENDPOINT, data=payload, headers=headers)
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to communicate with Christ University Keycloak: {str(exc)}",
            )

    if response.status_code != 200:
        # Keycloak error response (e.g. invalid code or expired)
        try:
            err_json = response.json()
            detail = err_json.get("error_description") or err_json.get("error") or response.text
        except Exception:
            detail = response.text
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Keycloak token exchange failed: {detail}",
        )

    token_data = response.json()
    return token_data


async def refresh_tokens_with_keycloak(refresh_token: str) -> Dict[str, Any]:
    """
    Exchange a valid refresh_token for a new access_token and rotated refresh_token.
    """
    payload = {
        "grant_type": "refresh_token",
        "client_id": KEYCLOAK_CLIENT_ID,
        "refresh_token": refresh_token,
    }

    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(TOKEN_ENDPOINT, data=payload, headers=headers)
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to reach Keycloak for token refresh: {str(exc)}",
            )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired — please log in again",
        )

    return response.json()


async def get_or_refresh_valid_access_token(
    user_id: str,
    current_access_token: str = None
) -> Tuple[str, str]:
    """
    Checks if current_access_token is still valid.
    If valid, returns it.
    If missing or expired, decrypts stored refresh token, fetches new token from Keycloak,
    updates DB with new rotated refresh token, and returns the fresh access token.
    """
    if current_access_token and not is_token_expired(current_access_token):
        return current_access_token, user_id

    # Token is expired or not provided: retrieve session from DB
    session_data = await db.get_user_session(user_id)
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session not found or expired. Please log in again.",
        )

    user, encrypted_refresh = session_data
    try:
        decrypted_refresh = decrypt_token(encrypted_refresh)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to decrypt session token. Please log in again.",
        )

    # Perform refresh
    new_tokens = await refresh_tokens_with_keycloak(decrypted_refresh)
    new_access_token = new_tokens.get("access_token")
    new_refresh_token = new_tokens.get("refresh_token")

    if not new_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Keycloak did not return an access token.",
        )

    # Rotate refresh token in DB if a new one was provided
    if new_refresh_token:
        new_encrypted = encrypt_token(new_refresh_token)
        await db.update_user_refresh_token(user_id, new_encrypted)

    return new_access_token, user_id

