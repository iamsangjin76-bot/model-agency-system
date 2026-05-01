# -*- coding: utf-8 -*-
"""
News search and save endpoints.

Routes:
  POST /news/search   — full-text news search via NewsAPI
  GET  /news/latest   — latest headlines (dashboard widget)
  POST /news/save     — persist selected articles to a local JSON file
  GET  /news/saved    — retrieve previously saved articles
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import get_db
from app.routers.auth import require_permission

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class NewsArticleResponse(BaseModel):
    """Single news article."""
    id: str
    title: str
    description: Optional[str]
    url: str
    image_url: Optional[str]
    source: str
    published_at: str


class NewsSearchRequest(BaseModel):
    """News search request payload."""
    query: str
    language: str = "ko"
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    page: int = 1
    page_size: int = 10


class SaveNewsRequest(BaseModel):
    """Payload for saving selected articles."""
    articles: List[NewsArticleResponse]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _demo_news(query: str, count: int = 10) -> List[NewsArticleResponse]:
    """Return placeholder articles when no API key is configured."""
    return [
        NewsArticleResponse(
            id=f"demo-news-{i + 1}",
            title=f"{query} 관련 뉴스 제목 {i + 1}",
            description=f"이 기사는 {query}에 관한 다양한 정보를 포함하고 있습니다.",
            url=f"https://example.com/news/{i + 1}",
            image_url=None,
            source="데모 뉴스",
            published_at=datetime.now().isoformat(),
        )
        for i in range(count)
    ]


async def _fetch_news(request: NewsSearchRequest) -> List[NewsArticleResponse]:
    """Call NewsAPI and return results; fall back to demo data on error."""
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        return _demo_news(request.query, request.page_size)

    params: dict = {
        "q": request.query, "language": request.language,
        "sortBy": "publishedAt", "page": request.page,
        "pageSize": request.page_size, "apiKey": api_key,
    }
    if request.from_date:
        params["from"] = request.from_date
    if request.to_date:
        params["to"] = request.to_date

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get("https://newsapi.org/v2/everything", params=params, timeout=10.0)
            resp.raise_for_status()
            return [
                NewsArticleResponse(
                    id=a["url"], title=a.get("title", ""),
                    description=a.get("description"), url=a["url"],
                    image_url=a.get("urlToImage"), source=a["source"]["name"],
                    published_at=a.get("publishedAt", ""),
                )
                for a in resp.json().get("articles", [])[:request.page_size]
            ]
        except Exception as e:
            print(f"News API error: {e}")
            return _demo_news(request.query, request.page_size)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/news/search", response_model=List[NewsArticleResponse])
async def search_news(
    request: NewsSearchRequest,
    current_user=Depends(require_permission("model", "read")),
):
    """Search news articles via NewsAPI."""
    return await _fetch_news(request)


@router.get("/news/latest", response_model=List[NewsArticleResponse])
async def get_latest_news(
    query: str = "모델",
    language: str = "ko",
    page: int = 1,
    page_size: int = 5,
    current_user=Depends(require_permission("model", "read")),
):
    """Return the latest headlines (used by the dashboard widget)."""
    return await _fetch_news(NewsSearchRequest(
        query=query, language=language, page=page, page_size=page_size,
    ))


@router.post("/news/save")
async def save_news(
    request: SaveNewsRequest,
    current_user=Depends(require_permission("model", "create")),
):
    """Persist selected articles to a local JSON file for the tablet view."""
    save_dir = os.path.join(settings.MODEL_FILES_DIR, "saved_news")
    os.makedirs(save_dir, exist_ok=True)
    payload = [
        {**a.dict(), "saved_at": datetime.now().isoformat()}
        for a in request.articles
    ]
    with open(os.path.join(save_dir, "tablet_news.json"), "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return {"message": f"{len(payload)}개 기사 저장 완료", "saved_count": len(payload),
            "file_url": "/model_files/saved_news/tablet_news.json"}


@router.get("/news/saved", response_model=List[dict])
async def get_saved_news(
    current_user=Depends(require_permission("model", "read")),
):
    """Retrieve previously saved articles."""
    save_file = os.path.join(settings.MODEL_FILES_DIR, "saved_news", "tablet_news.json")
    if os.path.exists(save_file):
        with open(save_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return []
