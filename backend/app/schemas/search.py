# -*- coding: utf-8 -*-
"""
Pydantic request/response schemas for the news and image search APIs.
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# News search — proxy response (not yet persisted)
# ---------------------------------------------------------------------------

class NewsArticle(BaseModel):
    title: str
    link: str
    description: str
    pub_date: str
    source: str
    image_url: Optional[str] = None
    provider: str                   # "naver" | "google"


class NewsSearchResult(BaseModel):
    total: int
    page: int
    display: int
    provider: str
    items: List[NewsArticle]


# ---------------------------------------------------------------------------
# News save
# ---------------------------------------------------------------------------

class NewsSaveRequest(BaseModel):
    model_id: int
    articles: List[NewsArticle]


class SavedNews(BaseModel):
    id: int
    model_id: int
    title: str
    link: str
    description: Optional[str] = None
    pub_date: Optional[str] = None
    source: Optional[str] = None
    image_url: Optional[str] = None
    provider: str
    memo: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class NewsSaveResponse(BaseModel):
    saved: int
    duplicates: int
    items: List[SavedNews]


# ---------------------------------------------------------------------------
# Image search — proxy response (not yet persisted)
# ---------------------------------------------------------------------------

class SearchImage(BaseModel):
    thumbnail_url: str
    original_url: str
    width: Optional[int] = None
    height: Optional[int] = None
    source: str
    provider: str                   # "naver" | "google"


class ImageSearchResult(BaseModel):
    total: int
    page: int
    display: int
    provider: str
    items: List[SearchImage]


# ---------------------------------------------------------------------------
# Image save
# ---------------------------------------------------------------------------

class ImageSaveRequest(BaseModel):
    model_id: int
    images: List[SearchImage]


class SavedSearchImage(BaseModel):
    id: int
    model_id: int
    original_url: str
    local_path: str
    filename: str
    width: Optional[int] = None
    height: Optional[int] = None
    file_size: Optional[int] = None
    source: Optional[str] = None
    provider: str
    memo: Optional[str] = None
    is_portfolio: bool
    created_at: str

    class Config:
        from_attributes = True


class ImageSaveResponse(BaseModel):
    saved: int
    failed: int
    duplicates: int
    items: List[SavedSearchImage]
