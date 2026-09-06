"""Minimal signed-token authentication for the first production-hardening slice."""

import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings


bearer_scheme = HTTPBearer(auto_error=False)


def _password_digest(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)


def verify_password(password: str) -> bool:
    if settings.ENVIRONMENT != "production" and not settings.ADMIN_PASSWORD_HASH:
        return hmac.compare_digest(password, settings.ADMIN_PASSWORD)
    try:
        encoded_salt, encoded_digest = settings.ADMIN_PASSWORD_HASH.split("$", 1)
        salt = base64.urlsafe_b64decode(encoded_salt.encode("ascii"))
        expected = base64.urlsafe_b64decode(encoded_digest.encode("ascii"))
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(_password_digest(password, salt), expected)


def create_password_hash(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = _password_digest(password, salt)
    encode = lambda value: base64.urlsafe_b64encode(value).decode("ascii")
    return f"{encode(salt)}${encode(digest)}"


def _sign(payload: bytes) -> str:
    signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), payload, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(signature).decode("ascii").rstrip("=")


def create_access_token(email: str) -> str:
    payload = {
        "sub": email,
        "exp": int(time.time()) + settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }
    encoded_payload = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    return f"{encoded_payload}.{_sign(encoded_payload.encode())}"


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        encoded_payload, signature = credentials.credentials.split(".", 1)
        expected_signature = _sign(encoded_payload.encode())
        if not hmac.compare_digest(signature, expected_signature):
            raise ValueError
        padding = "=" * (-len(encoded_payload) % 4)
        payload = json.loads(base64.urlsafe_b64decode(f"{encoded_payload}{padding}"))
        if payload["exp"] < int(time.time()):
            raise ValueError
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Invalid or expired token") from None

    return {"email": payload["sub"]}
