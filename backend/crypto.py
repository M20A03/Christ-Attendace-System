"""
AES-GCM encryption/decryption module for securely storing refresh tokens at rest.
Uses AES-256-GCM with a 12-byte random nonce and 16-byte authentication tag.
"""
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# 32-byte key required for AES-256
_KEY_ENV_VAR = "TOKEN_ENCRYPTION_KEY"
_DEFAULT_DEV_KEY = "c3VwZXItc2VjcmV0LWtleS1jaHJpc3QtYXBwLTIwMjYh"  # 32-byte base64 string for dev fallback


def get_encryption_key() -> bytes:
    """
    Retrieve and validate the 32-byte AES key from the environment.
    Falls back to a secure development key if none is set.
    """
    key_str = os.getenv(_KEY_ENV_VAR)
    if not key_str:
        key_str = _DEFAULT_DEV_KEY

    try:
        # Try decoding as base64
        key_bytes = base64.b64decode(key_str)
        if len(key_bytes) == 32:
            return key_bytes
    except Exception:
        pass

    # If raw string is 32 bytes or needs padding/truncating
    raw_bytes = key_str.encode("utf-8")
    if len(raw_bytes) == 32:
        return raw_bytes
    elif len(raw_bytes) > 32:
        return raw_bytes[:32]
    else:
        return raw_bytes.ljust(32, b"0")


def encrypt_token(token: str) -> bytes:
    """
    Encrypt a plaintext token using AES-256-GCM.
    Returns: nonce (12 bytes) + ciphertext + tag (16 bytes)
    """
    if not token:
        raise ValueError("Cannot encrypt an empty token")

    key = get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce for GCM
    data = token.encode("utf-8")
    encrypted_payload = aesgcm.encrypt(nonce, data, None)
    return nonce + encrypted_payload


def decrypt_token(encrypted_data: bytes) -> str:
    """
    Decrypt an AES-256-GCM payload.
    Expects first 12 bytes to be nonce, followed by ciphertext and 16-byte tag.
    """
    if not encrypted_data or len(encrypted_data) < 28:
        raise ValueError("Invalid encrypted token data format")

    key = get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = encrypted_data[:12]
    ciphertext_with_tag = encrypted_data[12:]
    decrypted_bytes = aesgcm.decrypt(nonce, ciphertext_with_tag, None)
    return decrypted_bytes.decode("utf-8")
