"""Authentication support for legacy signed tokens and optional Firebase ID tokens."""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings

try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    from firebase_admin import credentials
except ImportError:  # pragma: no cover - optional dependency
    firebase_admin = None
    firebase_auth = None
    credentials = None


bearer_scheme = HTTPBearer(auto_error=False)


def _initialize_firebase() -> None:
    if firebase_admin is None:
        return
    if firebase_admin._apps:
        return
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    if not project_id and not service_account_json:
        return

    if service_account_json:
        try:
            config = json.loads(service_account_json)
            firebase_admin.initialize_app(credentials.Certificate(config), {"projectId": project_id or config.get("project_id")})
            return
        except (TypeError, ValueError, json.JSONDecodeError):
            pass

    firebase_admin.initialize_app(options={"projectId": project_id} if project_id else None)


_initialize_firebase()


def verify_firebase_token(token: str) -> dict[str, Any] | None:
    if firebase_auth is None:
        return None
    try:
        decoded = firebase_auth.verify_id_token(token)
        return {"email": decoded.get("email")}
    except Exception:
        return None


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

    firebase_user = verify_firebase_token(credentials.credentials)
    if firebase_user:
        return firebase_user

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
