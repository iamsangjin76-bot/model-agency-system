# -*- coding: utf-8 -*-
"""In-memory sliding-window rate limiter for login endpoints.

Designed for single-worker deployments (Railway with 1 uvicorn worker).
Uses X-Forwarded-For to get the real client IP behind Railway's reverse proxy.
"""

from collections import defaultdict
from time import time
from fastapi import Request, HTTPException


# Track timestamps of recent attempts per IP
_attempts: dict[str, list[float]] = defaultdict(list)

MAX_ATTEMPTS = 10   # max requests allowed
WINDOW_SEC = 60     # sliding window in seconds


def _get_client_ip(request: Request) -> str:
    """Extract real client IP, respecting Railway's forwarding headers."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"


async def login_rate_limit(request: Request) -> None:
    """FastAPI dependency: enforce 10 login attempts per IP per minute."""
    ip = _get_client_ip(request)
    now = time()

    # Remove timestamps outside the sliding window
    _attempts[ip] = [t for t in _attempts[ip] if now - t < WINDOW_SEC]

    if len(_attempts[ip]) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail=f"로그인 시도가 너무 많습니다. {WINDOW_SEC}초 후 다시 시도해주세요.",
            headers={"Retry-After": str(WINDOW_SEC)},
        )

    _attempts[ip].append(now)
