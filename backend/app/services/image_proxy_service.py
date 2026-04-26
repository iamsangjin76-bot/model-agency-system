# -*- coding: utf-8 -*-
"""
Image proxy service — fetch, cache, and verify external images.

SSRF defense implemented via validate_proxy_host() in utils/security.py.
No new pip packages: httpx (already installed), hashlib + pathlib (stdlib).
"""
from __future__ import annotations

import hashlib
import time
from pathlib import Path
from urllib.parse import urlparse, unquote

import httpx
from fastapi import HTTPException

from app.config import settings
from app.utils.security import validate_proxy_host

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_ALLOWED_CONTENT_TYPES = frozenset({
    "image/jpeg", "image/png", "image/webp", "image/gif",
})

# Magic byte signatures (first N bytes → expected content-type)
_MAGIC: list[tuple[bytes, str]] = [
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"GIF87a", "image/gif"),
    (b"GIF89a", "image/gif"),
    # WebP: RIFF????WEBP — handled separately below
]


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------

def _cache_key(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()


def _cache_paths(url: str) -> tuple[Path, Path]:
    """Return (data_path, content_type_path) — 2-level fanout (SPEC §6.6.2)."""
    h = _cache_key(url)
    base = Path(settings.IMAGE_PROXY_CACHE_DIR) / h[:2] / h[2:]
    return base.with_suffix(".bin"), base.with_suffix(".ct")


def _cache_valid(data_path: Path) -> bool:
    if not data_path.exists():
        return False
    age = time.time() - data_path.stat().st_mtime
    return age < settings.IMAGE_PROXY_CACHE_TTL


# ---------------------------------------------------------------------------
# Magic byte verification
# ---------------------------------------------------------------------------

def _verify_magic(data: bytes) -> str | None:
    """Return detected content-type or None if not a recognised image format."""
    for magic, ctype in _MAGIC:
        if data[: len(magic)] == magic:
            return ctype
    # WebP special case: RIFF + 4 bytes + WEBP
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def fetch_proxied_image(url: str) -> tuple[bytes, str]:
    """
    Validate, optionally return from cache, otherwise download and cache.

    Returns (image_bytes, content_type).
    Raises HTTPException on any security/protocol violation.
    """
    # 1. URL decode exactly once (double-encoding bypass prevention)
    decoded = unquote(url)
    if decoded != url:
        url = decoded  # use decoded form for further validation

    # 2. Scheme whitelist
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=422, detail="URL scheme must be http or https")

    hostname = (parsed.hostname or "").lower()
    if not hostname:
        raise HTTPException(status_code=422, detail="URL has no hostname")

    # 3. Host whitelist + private IP check (DNS re-resolved, no TTL cache)
    if not validate_proxy_host(hostname, settings.image_proxy_allowed_suffixes):
        raise HTTPException(status_code=403, detail="Host not in proxy allowlist")

    # 4. Disk cache hit?
    data_path, ct_path = _cache_paths(url)
    if _cache_valid(data_path) and ct_path.exists():
        return data_path.read_bytes(), ct_path.read_text().strip()

    # 5. Fetch — no redirect follow, streaming size check
    # Initialise outside try so raw_ct and chunks are accessible post-block
    chunks: list[bytes] = []
    raw_ct: str = ""
    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(settings.IMAGE_PROXY_TIMEOUT),
            follow_redirects=False,
            headers={"Referer": f"https://{hostname}/"},
        ) as client:
            async with client.stream("GET", url) as resp:
                if resp.is_redirect:
                    raise HTTPException(status_code=502, detail="Upstream redirect not followed")
                resp.raise_for_status()

                raw_ct = resp.headers.get("content-type", "").split(";")[0].strip().lower()
                if raw_ct not in _ALLOWED_CONTENT_TYPES:
                    raise HTTPException(
                        status_code=415,
                        detail=f"Upstream Content-Type not allowed: {raw_ct}",
                    )

                total = 0
                async for chunk in resp.aiter_bytes(8192):
                    total += len(chunk)
                    if total > settings.IMAGE_PROXY_MAX_SIZE:
                        raise HTTPException(status_code=413, detail="Image exceeds size limit")
                    chunks.append(chunk)

    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"Upstream HTTP error: {exc.response.status_code}")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Upstream request timed out")
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Upstream connection failed")

    data = b"".join(chunks)

    # 6. Magic bytes verification + header/magic mismatch check (SPEC §6.5)
    detected_ct = _verify_magic(data)
    if detected_ct is None:
        raise HTTPException(status_code=415, detail="Response body is not a recognised image format")
    if detected_ct != raw_ct:
        raise HTTPException(status_code=415, detail="Content-Type 헤더와 실제 이미지 형식 불일치")

    # 7. Persist to disk cache (2-level fanout directory)
    data_path.parent.mkdir(parents=True, exist_ok=True)
    data_path.write_bytes(data)
    ct_path.write_text(detected_ct)

    return data, detected_ct
