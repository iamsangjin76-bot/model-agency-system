# -*- coding: utf-8 -*-
"""
News and image search service.

Proxies requests to Naver Search API (primary) and Google Custom Search API
(secondary/fallback) and normalises both responses into unified schemas.
"""

from __future__ import annotations

import asyncio
import re
from urllib.parse import urlparse
from email.utils import parsedate_to_datetime

import httpx
from fastapi import HTTPException

from app.config import settings
from app.schemas.search import (
    NewsArticle, NewsSearchResult,
    SearchImage, ImageSearchResult,
)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _strip_html(text: str) -> str:
    """Remove HTML tags from a string."""
    return re.sub(r"<[^>]+>", "", text or "").strip()


def _parse_rfc822_to_iso(date_str: str) -> str:
    """Convert RFC 822 date string to ISO 8601. Returns empty string on failure."""
    try:
        return parsedate_to_datetime(date_str).isoformat()
    except Exception:
        return date_str or ""


def _extract_domain(url: str) -> str:
    """Extract the domain (netloc) from a URL."""
    try:
        return urlparse(url).netloc or url
    except Exception:
        return url


def _truncate(text: str, max_len: int = 300) -> str:
    """Truncate text to max_len characters."""
    return (text[:max_len] + "…") if len(text) > max_len else text


_OG_IMAGE_RE = re.compile(
    r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']'
    r'|<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
    re.IGNORECASE,
)


async def _fetch_og_image(client: httpx.AsyncClient, url: str) -> str | None:
    """Fetch og:image from an article URL. Returns None on any failure."""
    try:
        resp = await client.get(url, timeout=1.5, follow_redirects=True)
        m = _OG_IMAGE_RE.search(resp.text)
        return next((g for g in (m.group(1), m.group(2)) if g), None) if m else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Naver API calls
# ---------------------------------------------------------------------------

_NAVER_NEWS_URL = "https://openapi.naver.com/v1/search/news.json"
_NAVER_IMAGE_URL = "https://openapi.naver.com/v1/search/image"


async def _search_naver_news(query: str, start: int, display: int) -> tuple[list[NewsArticle], int]:
    headers = {
        "X-Naver-Client-Id": settings.NAVER_CLIENT_ID or "",
        "X-Naver-Client-Secret": settings.NAVER_CLIENT_SECRET or "",
    }
    async with httpx.AsyncClient(timeout=settings.SEARCH_REQUEST_TIMEOUT) as client:
        resp = client.get(
            _NAVER_NEWS_URL,
            headers=headers,
            params={"query": query, "start": start, "display": display, "sort": "date"},
        )
        resp = await resp
        resp.raise_for_status()
    data = resp.json()
    total = data.get("total", 0)
    articles = [
        NewsArticle(
            title=_strip_html(item.get("title", "")),
            link=item.get("link", ""),
            description=_truncate(_strip_html(item.get("description", ""))),
            pub_date=_parse_rfc822_to_iso(item.get("pubDate", "")),
            source=_extract_domain(item.get("originallink", item.get("link", ""))),
            image_url=None,
            provider="naver",
        )
        for item in data.get("items", [])
    ]
    # Batch-fetch og:image from each article in parallel (1.5 s timeout each)
    async with httpx.AsyncClient(headers={"User-Agent": "Mozilla/5.0"}) as og_client:
        og_results = await asyncio.gather(
            *[_fetch_og_image(og_client, a.link) for a in articles],
            return_exceptions=True,
        )
    articles = [
        a.model_copy(update={"image_url": img if isinstance(img, str) else None})
        for a, img in zip(articles, og_results)
    ]
    return articles, total


async def _search_naver_images(query: str, start: int, display: int) -> tuple[list[SearchImage], int]:
    headers = {
        "X-Naver-Client-Id": settings.NAVER_CLIENT_ID or "",
        "X-Naver-Client-Secret": settings.NAVER_CLIENT_SECRET or "",
    }
    async with httpx.AsyncClient(timeout=settings.SEARCH_REQUEST_TIMEOUT) as client:
        resp = await client.get(
            _NAVER_IMAGE_URL,
            headers=headers,
            params={"query": query, "start": start, "display": display},
        )
        resp.raise_for_status()
    data = resp.json()
    total = data.get("total", 0)
    images = [
        SearchImage(
            thumbnail_url=item.get("thumbnail", ""),
            original_url=item.get("link", ""),
            width=int(item["sizewidth"]) if item.get("sizewidth") else None,
            height=int(item["sizeheight"]) if item.get("sizeheight") else None,
            source=_extract_domain(item.get("link", "")),
            provider="naver",
        )
        for item in data.get("items", [])
    ]
    return images, total


# ---------------------------------------------------------------------------
# Google CSE calls
# ---------------------------------------------------------------------------

_GOOGLE_CSE_URL = "https://www.googleapis.com/customsearch/v1"


async def _search_google_news(query: str, start: int, display: int) -> tuple[list[NewsArticle], int]:
    async with httpx.AsyncClient(timeout=settings.SEARCH_REQUEST_TIMEOUT) as client:
        resp = await client.get(
            _GOOGLE_CSE_URL,
            params={
                "key": settings.GOOGLE_API_KEY,
                "cx": settings.GOOGLE_CX,
                "q": query,
                "start": start,
                "num": display,
                "sort": "date",
            },
        )
        resp.raise_for_status()
    data = resp.json()
    total = int(data.get("searchInformation", {}).get("totalResults", 0))
    articles = []
    for item in data.get("items", []):
        pagemap = item.get("pagemap", {})
        metatags = (pagemap.get("metatags") or [{}])[0]
        pub_date = metatags.get("article:published_time", "")
        img_list = pagemap.get("cse_image") or []
        image_url = img_list[0].get("src") if img_list else None
        articles.append(NewsArticle(
            title=item.get("title", ""),
            link=item.get("link", ""),
            description=_truncate(_strip_html(item.get("snippet", ""))),
            pub_date=pub_date,
            source=item.get("displayLink", ""),
            image_url=image_url,
            provider="google",
        ))
    return articles, total


async def _search_google_images(query: str, start: int, display: int) -> tuple[list[SearchImage], int]:
    async with httpx.AsyncClient(timeout=settings.SEARCH_REQUEST_TIMEOUT) as client:
        resp = await client.get(
            _GOOGLE_CSE_URL,
            params={
                "key": settings.GOOGLE_API_KEY,
                "cx": settings.GOOGLE_CX,
                "q": query,
                "searchType": "image",
                "start": start,
                "num": display,
            },
        )
        resp.raise_for_status()
    data = resp.json()
    total = int(data.get("searchInformation", {}).get("totalResults", 0))
    images = [
        SearchImage(
            thumbnail_url=item.get("image", {}).get("thumbnailLink", ""),
            original_url=item.get("link", ""),
            width=item.get("image", {}).get("width"),
            height=item.get("image", {}).get("height"),
            source=item.get("displayLink", ""),
            provider="google",
        )
        for item in data.get("items", [])
    ]
    return images, total


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def search_news(
    query: str,
    page: int = 1,
    display: int = 10,
    provider: str = "naver",
) -> NewsSearchResult:
    """Search news with automatic provider fallback."""
    start = (page - 1) * display + 1
    naver_ok = bool(settings.NAVER_CLIENT_ID and settings.NAVER_CLIENT_SECRET)
    google_ok = bool(settings.GOOGLE_API_KEY and settings.GOOGLE_CX)

    if not naver_ok and not google_ok:
        raise HTTPException(status_code=503, detail="No news API credentials configured")

    if provider == "naver" and naver_ok:
        try:
            items, total = await _search_naver_news(query, start, display)
            return NewsSearchResult(total=total, page=page, display=display, provider="naver", items=items)
        except Exception:
            if not google_ok:
                raise HTTPException(status_code=503, detail="Naver API failed and Google fallback is not configured")
            items, total = await _search_google_news(query, start, display)
            return NewsSearchResult(total=total, page=page, display=display, provider="google-fallback", items=items)

    if not google_ok:
        raise HTTPException(status_code=503, detail="Google API credentials not configured")
    try:
        items, total = await _search_google_news(query, start, display)
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Google Search API 일시 장애 (HTTP {e.response.status_code})",
        )
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Google Search API 연결 실패")
    return NewsSearchResult(total=total, page=page, display=display, provider="google", items=items)


async def search_images(
    query: str,
    page: int = 1,
    display: int = 10,
    provider: str = "google",
) -> ImageSearchResult:
    """Search images with automatic provider fallback."""
    start = (page - 1) * display + 1
    naver_ok = bool(settings.NAVER_CLIENT_ID and settings.NAVER_CLIENT_SECRET)
    google_ok = bool(settings.GOOGLE_API_KEY and settings.GOOGLE_CX)

    if not naver_ok and not google_ok:
        raise HTTPException(status_code=503, detail="No image search API credentials configured")

    if provider == "google" and google_ok:
        try:
            items, total = await _search_google_images(query, start, display)
            return ImageSearchResult(total=total, page=page, display=display, provider="google", items=items)
        except Exception:
            if not naver_ok:
                raise HTTPException(status_code=503, detail="Google API failed and Naver fallback is not configured")
            items, total = await _search_naver_images(query, start, display)
            return ImageSearchResult(total=total, page=page, display=display, provider="naver-fallback", items=items)

    if not naver_ok:
        raise HTTPException(status_code=503, detail="Naver API credentials not configured")
    try:
        items, total = await _search_naver_images(query, start, display)
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Naver Search API 일시 장애 (HTTP {e.response.status_code})",
        )
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Naver Search API 연결 실패")
    return ImageSearchResult(total=total, page=page, display=display, provider="naver", items=items)
