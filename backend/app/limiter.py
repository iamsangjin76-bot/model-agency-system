# -*- coding: utf-8 -*-
"""Rate limiter singleton — shared across all routers.

Uses X-Forwarded-For header to get the real client IP behind Railway's
reverse proxy. Falls back to X-Real-IP, then request.client.host.
"""

from slowapi import Limiter
from starlette.requests import Request


def _get_real_ip(request: Request) -> str:
    """Extract the real client IP, respecting proxy forwarding headers."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=_get_real_ip)
