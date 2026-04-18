# -*- coding: utf-8 -*-
"""
News search and save API router.

Endpoints:
  GET  /search              — proxy search (Naver / Google)
  POST /save                — persist checked articles linked to a model
  GET  /model/{model_id}    — list saved news for a model
  DELETE /{news_id}         — delete a saved news record
"""

from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path
from uuid import uuid4
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import get_db, Model
from app.models.search import ModelNews
from app.routers.auth import require_permission
from app.schemas.search import (
    NewsSearchResult, NewsSaveRequest, NewsSaveResponse, SavedNews,
)
from app.services.search_service import search_news as _search_news

router = APIRouter()

_UPLOAD = Path(settings.UPLOAD_DIR)


# ---------------------------------------------------------------------------
# GET /search
# ---------------------------------------------------------------------------

@router.get("/search", response_model=NewsSearchResult)
async def search(
    query: str = Query(..., min_length=1, max_length=100),
    page: int = Query(1, ge=1),
    display: int = Query(10, ge=1, le=100),
    provider: str = Query("naver"),
    _: Any = Depends(require_permission("news", "search")),
):
    return await _search_news(query, page, display, provider)


# ---------------------------------------------------------------------------
# POST /save
# ---------------------------------------------------------------------------

@router.post("/save", response_model=NewsSaveResponse, status_code=status.HTTP_201_CREATED)
def save_articles(
    body: NewsSaveRequest,
    db: Session = Depends(get_db),
    _: Any = Depends(require_permission("news", "save")),
):
    model = db.query(Model).filter(Model.id == body.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    folder = model.folder_path or f"models/{model.id}"
    news_dir = _UPLOAD / folder / "news"
    news_dir.mkdir(parents=True, exist_ok=True)

    saved, duplicates, items = 0, 0, []

    for article in body.articles:
        exists = (
            db.query(ModelNews)
            .filter(ModelNews.model_id == body.model_id, ModelNews.link == article.link)
            .first()
        )
        if exists:
            duplicates += 1
            continue

        short_id = uuid4().hex[:8]
        filename = f"{date.today()}_{short_id}.json"
        rel_path = f"{folder}/news/{filename}"

        payload = {
            "title": article.title, "link": article.link,
            "description": article.description, "pub_date": article.pub_date,
            "source": article.source, "provider": article.provider,
            "saved_at": datetime.utcnow().isoformat(),
        }
        (news_dir / filename).write_text(
            json.dumps(payload, ensure_ascii=False), encoding="utf-8"
        )

        record = ModelNews(
            model_id=body.model_id,
            title=article.title, link=article.link,
            description=article.description, pub_date=article.pub_date,
            source=article.source, image_url=article.image_url,
            provider=article.provider, saved_path=rel_path,
        )
        db.add(record)
        db.flush()
        items.append(_to_saved(record))
        saved += 1

    db.commit()
    return NewsSaveResponse(saved=saved, duplicates=duplicates, items=items)


# ---------------------------------------------------------------------------
# GET /model/{model_id}
# ---------------------------------------------------------------------------

@router.get("/model/{model_id}")
def list_model_news(
    model_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: Any = Depends(require_permission("news", "search")),
):
    q = db.query(ModelNews).filter(ModelNews.model_id == model_id)
    total = q.count()
    records = (
        q.order_by(ModelNews.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return {"total": total, "items": [_to_saved(r) for r in records]}


# ---------------------------------------------------------------------------
# DELETE /{news_id}
# ---------------------------------------------------------------------------

@router.delete("/{news_id}")
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    _: Any = Depends(require_permission("news", "delete")),
):
    record = db.query(ModelNews).filter(ModelNews.id == news_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="News record not found")

    if record.saved_path:
        try:
            (_UPLOAD / record.saved_path).unlink(missing_ok=True)
        except Exception:
            pass

    db.delete(record)
    db.commit()
    return {"message": "삭제되었습니다"}


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

def _to_saved(r: ModelNews) -> SavedNews:
    return SavedNews(
        id=r.id, model_id=r.model_id,
        title=r.title, link=r.link,
        description=r.description, pub_date=r.pub_date,
        source=r.source, image_url=r.image_url,
        provider=r.provider, memo=r.memo,
        created_at=r.created_at.isoformat() if r.created_at else "",
    )
