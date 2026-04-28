# -*- coding: utf-8 -*-
"""
YouTube Data API v3 — Channel statistics client.

Fetches subscriber count, video count, and total view count for a YouTube channel.
Handles channel ID (UCxxx), @handle, username, and full URL formats.

Requires YOUTUBE_API_KEY (or falls back to GOOGLE_API_KEY) in .env.
Enable YouTube Data API v3 at: https://console.cloud.google.com/apis/library
"""

from __future__ import annotations

import re
import time
from typing import Any

import httpx

from app.config import settings

_YOUTUBE_API = "https://www.googleapis.com/youtube/v3"


class YouTubeNotConfiguredError(Exception):
    """Raised when no API key is available."""


class YouTubeAPIError(Exception):
    """Raised when the YouTube API returns an error."""
    def __init__(self, message: str, code: int | None = None):
        super().__init__(message)
        self.code = code


def _get_api_key() -> str:
    key = settings.YOUTUBE_API_KEY or settings.GOOGLE_API_KEY
    if not key:
        raise YouTubeNotConfiguredError(
            "YouTube API key not configured. "
            "Set YOUTUBE_API_KEY (or GOOGLE_API_KEY) in .env and enable "
            "YouTube Data API v3 at https://console.cloud.google.com"
        )
    return key


def _parse_channel_input(raw: str) -> dict[str, str]:
    """
    Parse various YouTube channel identifier formats into API query params.

    Supported formats:
      UCxxxxxxxxxx          → {id: UCxxx}
      @channelhandle        → {forHandle: @handle}
      youtube.com/channel/UCxxx   → {id: UCxxx}
      youtube.com/@handle         → {forHandle: @handle}
      youtube.com/c/name          → {forUsername: name}
      youtube.com/user/name       → {forUsername: name}
      plain username              → {forUsername: name}
    """
    s = raw.strip().rstrip("/")

    # Extract from full URL
    if "youtube.com" in s or "youtu.be" in s:
        m = re.search(r"/channel/(UC[\w-]+)", s)
        if m:
            return {"id": m.group(1)}
        m = re.search(r"/@([\w.-]+)", s)
        if m:
            return {"forHandle": f"@{m.group(1)}"}
        m = re.search(r"/(?:c|user)/([\w.-]+)", s)
        if m:
            return {"forUsername": m.group(1)}

    # Channel ID
    if re.match(r"^UC[\w-]{10,}$", s):
        return {"id": s}

    # @handle
    if s.startswith("@"):
        return {"forHandle": s}

    # Plain username / channel name
    return {"forUsername": s}


async def fetch_channel(youtube_id: str) -> dict[str, Any]:
    """
    Fetch channel statistics for youtube_id.

    Returns:
        channel_id, channel_title, subscriber_count, video_count,
        view_count, subscribers_hidden, duration_ms
    """
    key = _get_api_key()
    query_params = _parse_channel_input(youtube_id)

    params = {"part": "statistics,snippet", "key": key, **query_params}

    t0 = time.monotonic()
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{_YOUTUBE_API}/channels", params=params)
    duration_ms = int((time.monotonic() - t0) * 1000)

    data = resp.json()

    if "error" in data:
        err = data["error"]
        raise YouTubeAPIError(
            err.get("message", "Unknown YouTube API error"),
            code=err.get("code"),
        )

    items = data.get("items", [])
    if not items:
        raise YouTubeAPIError(f"채널을 찾을 수 없습니다: {youtube_id}")

    ch = items[0]
    stats = ch.get("statistics", {})
    snippet = ch.get("snippet", {})

    def _int(val: str | None) -> int | None:
        try:
            return int(val) if val else None
        except (ValueError, TypeError):
            return None

    return {
        "channel_id": ch.get("id"),
        "channel_title": snippet.get("title"),
        "subscriber_count": _int(stats.get("subscriberCount")),
        "video_count": _int(stats.get("videoCount")),
        "view_count": _int(stats.get("viewCount")),
        "subscribers_hidden": stats.get("hiddenSubscriberCount", False),
        "duration_ms": duration_ms,
        "raw_response": data,
    }
