# -*- coding: utf-8 -*-
"""
Instagram Graph API — Business Discovery client.

Fetches public follower metrics and recent post engagement for a target
Instagram Business / Creator account.

When INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_MY_IG_USER_ID are not configured,
all functions raise InstagramNotConfiguredError so callers can return graceful
503 responses instead of crashing.
"""

from __future__ import annotations

import time
from datetime import datetime
from typing import Any

import httpx

from app.config import settings

GRAPH_URL = "https://graph.facebook.com/v22.0"
_MEDIA_FIELDS = (
    "id,media_type,like_count,comments_count,timestamp,permalink,caption"
)


class InstagramNotConfiguredError(Exception):
    """Raised when required env vars are missing."""


class InstagramAPIError(Exception):
    """Raised when the Graph API returns an error response."""
    def __init__(self, message: str, code: int | None = None):
        super().__init__(message)
        self.code = code


def _require_config() -> tuple[str, str]:
    """Return (access_token, my_ig_user_id) or raise InstagramNotConfiguredError."""
    token = settings.INSTAGRAM_ACCESS_TOKEN
    uid = settings.INSTAGRAM_MY_IG_USER_ID
    if not token or not uid:
        raise InstagramNotConfiguredError(
            "Instagram Graph API not configured. "
            "Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_MY_IG_USER_ID in .env"
        )
    return token, uid


async def fetch_profile(ig_username: str) -> dict[str, Any]:
    """
    Fetch follower counts + last 10 posts for ig_username via Business Discovery.

    Returns a dict with keys:
        followers_count, follows_count, media_count, username, name,
        media (list of post dicts), duration_ms, raw_response
    """
    token, uid = _require_config()

    fields = (
        f"business_discovery.username({ig_username}){{"
        f"followers_count,follows_count,media_count,username,name,"
        f"media.limit(10){{{_MEDIA_FIELDS}}}"
        f"}}"
    )

    t0 = time.monotonic()
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{GRAPH_URL}/{uid}",
            params={"fields": fields, "access_token": token},
        )

    duration_ms = int((time.monotonic() - t0) * 1000)
    data = resp.json()

    if "error" in data:
        err = data["error"]
        raise InstagramAPIError(
            err.get("message", "Unknown Graph API error"),
            code=err.get("code"),
        )

    bd = data.get("business_discovery", {})
    media_items = bd.get("media", {}).get("data", [])

    return {
        "followers_count": bd.get("followers_count"),
        "follows_count": bd.get("follows_count"),
        "media_count": bd.get("media_count"),
        "username": bd.get("username", ig_username),
        "name": bd.get("name"),
        "media": media_items,
        "duration_ms": duration_ms,
        "raw_response": data,
    }


def parse_media_item(item: dict[str, Any], model_id: int) -> dict[str, Any]:
    """Convert a Graph API media item into a MediaMetric-compatible dict."""
    posted_at = None
    ts = item.get("timestamp")
    if ts:
        try:
            posted_at = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except ValueError:
            pass

    caption = item.get("caption", "") or ""
    return {
        "model_id": model_id,
        "media_id": item.get("id"),
        "media_type": item.get("media_type"),
        "posted_at": posted_at,
        "like_count": item.get("like_count"),
        "comment_count": item.get("comments_count"),
        "caption_excerpt": caption[:100] if caption else None,
        "permalink": item.get("permalink"),
    }
