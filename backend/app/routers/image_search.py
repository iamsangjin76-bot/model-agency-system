# -*- coding: utf-8 -*-
"""
Image search and save API router.

Endpoints:
  GET  /search                    — proxy search (Google / Naver)
  POST /save                      — download + persist images linked to a model
  GET  /model/{model_id}          — list saved search images for a model
  POST /{image_id}/to-portfolio   — promote a search image to portfolio
  DELETE /{image_id}              — delete a saved search image
"""

from __future__ import annotations

import io
import shutil
from pathlib import Path
from uuid import uuid4
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from PIL import Image as PilImage

from app.config import settings
from app.models.database import get_db, Model, ModelFile
from app.models.search import ModelSearchImage
from app.routers.auth import require_permission
from app.schemas.search import (
    ImageSearchResult, ImageSaveRequest, ImageSaveResponse, SavedSearchImage,
    to_saved_search_image as _to_saved,
)
from app.services.search_service import search_images as _search_images
from app.utils.security import validate_image_url, validate_magic_bytes

router = APIRouter()

_UPLOAD = Path(settings.UPLOAD_DIR)

_CT_EXT: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
}


# ---------------------------------------------------------------------------
# GET /search
# ---------------------------------------------------------------------------

@router.get("/search", response_model=ImageSearchResult)
async def search(
    query: str = Query(..., min_length=1, max_length=100),
    page: int = Query(1, ge=1),
    display: int = Query(10, ge=1, le=30),
    provider: str = Query("google"),
    _: Any = Depends(require_permission("image", "search")),
):
    return await _search_images(query, page, display, provider)


# ---------------------------------------------------------------------------
# POST /save
# ---------------------------------------------------------------------------

@router.post("/save", response_model=ImageSaveResponse, status_code=status.HTTP_201_CREATED)
async def save_images(
    body: ImageSaveRequest,
    db: Session = Depends(get_db),
    _: Any = Depends(require_permission("image", "save")),
):
    model = db.query(Model).filter(Model.id == body.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    folder = model.folder_path or f"models/{model.id}"
    img_dir = _UPLOAD / folder / "images"
    img_dir.mkdir(parents=True, exist_ok=True)

    saved, failed, duplicates, items = 0, 0, 0, []

    for img in body.images:
        # Duplicate check
        exists = (
            db.query(ModelSearchImage)
            .filter(ModelSearchImage.model_id == body.model_id,
                    ModelSearchImage.original_url == img.original_url)
            .first()
        )
        if exists:
            duplicates += 1
            continue

        # SSRF defence
        if not validate_image_url(img.original_url):
            failed += 1
            continue

        # Download (streaming, size-limited)
        try:
            content = b""
            async with httpx.AsyncClient(timeout=settings.SEARCH_REQUEST_TIMEOUT) as client:
                async with client.stream("GET", img.original_url) as resp:
                    resp.raise_for_status()
                    ct = resp.headers.get("content-type", "").split(";")[0].strip()
                    if ct not in _CT_EXT:
                        failed += 1
                        continue
                    async for chunk in resp.aiter_bytes(8192):
                        content += chunk
                        if len(content) > settings.SEARCH_IMAGE_MAX_SIZE:
                            break
        except Exception:
            failed += 1
            continue

        if not content or len(content) > settings.SEARCH_IMAGE_MAX_SIZE:
            failed += 1
            continue

        # Magic-byte validation
        if not validate_magic_bytes(content):
            failed += 1
            continue

        ext = _CT_EXT.get(ct, "jpg")
        filename = f"{uuid4().hex}.{ext}"
        dest = img_dir / filename
        dest.write_bytes(content)

        # Dimensions via Pillow (best-effort)
        width = height = None
        try:
            with PilImage.open(io.BytesIO(content)) as pil:
                width, height = pil.size
        except Exception:
            pass

        rel_path = f"{folder}/images/{filename}"
        record = ModelSearchImage(
            model_id=body.model_id,
            original_url=img.original_url,
            local_path=rel_path,
            filename=filename,
            width=width, height=height,
            file_size=len(content),
            source=img.source,
            provider=img.provider,
        )
        db.add(record)
        db.flush()
        items.append(_to_saved(record))
        saved += 1

    db.commit()

    # Sync saved images → ModelFile so they appear in profile sidebar.
    # ALL saved images become sub images (is_profile_image=False).
    # If model has no profile photo, ALSO create a separate profile record for the 1st image.
    if saved > 0:
        has_profile = db.query(ModelFile).filter(
            ModelFile.model_id == body.model_id,
            ModelFile.is_profile_image == True,  # noqa: E712
        ).first()
        max_order_row = (
            db.query(ModelFile)
            .filter(ModelFile.model_id == body.model_id,
                    ModelFile.is_profile_image == False)  # noqa: E712
            .order_by(ModelFile.display_order.desc())
            .first()
        )
        next_order = (max_order_row.display_order + 1) if max_order_row else 0

        # All images → sub image slots (is_profile_image=False)
        for idx, img in enumerate(items):
            db.add(ModelFile(
                model_id=body.model_id,
                file_name=img.filename,
                file_path=img.local_path,
                file_type="image",
                file_size=img.file_size,
                is_profile_image=False,
                display_order=next_order + idx,
            ))

        # If no profile exists, also register the 1st image as profile
        if not has_profile:
            first = items[0]
            db.add(ModelFile(
                model_id=body.model_id,
                file_name=first.filename,
                file_path=first.local_path,
                file_type="image",
                file_size=first.file_size,
                is_profile_image=True,
                display_order=0,
            ))
        db.commit()

    return ImageSaveResponse(saved=saved, failed=failed, duplicates=duplicates, items=items)


# ---------------------------------------------------------------------------
# GET /model/{model_id}
# ---------------------------------------------------------------------------

@router.get("/model/{model_id}")
def list_model_images(
    model_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: Any = Depends(require_permission("image", "search")),
):
    q = db.query(ModelSearchImage).filter(ModelSearchImage.model_id == model_id)
    total = q.count()
    records = (
        q.order_by(ModelSearchImage.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return {"total": total, "items": [_to_saved(r) for r in records]}


# ---------------------------------------------------------------------------
# POST /{image_id}/to-portfolio
# ---------------------------------------------------------------------------

@router.post("/{image_id}/to-portfolio")
def to_portfolio(
    image_id: int,
    db: Session = Depends(get_db),
    _: Any = Depends(require_permission("image", "save")),
):
    record = db.query(ModelSearchImage).filter(ModelSearchImage.id == image_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Image record not found")
    if record.is_portfolio:
        raise HTTPException(status_code=409, detail="이미 포트폴리오에 등록된 이미지입니다")

    model = db.query(Model).filter(Model.id == record.model_id).first()
    folder = model.folder_path if model and model.folder_path else f"models/{record.model_id}"

    src = _UPLOAD / record.local_path
    ext = Path(record.filename).suffix.lstrip(".")
    new_name = f"{uuid4().hex}.{ext}"
    dest_rel = f"{folder}/{new_name}"
    dest = _UPLOAD / dest_rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)

    db_file = ModelFile(
        model_id=record.model_id,
        file_name=record.filename,
        file_path=dest_rel,
        file_type="portfolio",
        file_size=record.file_size,
        is_profile_image=False,
    )
    db.add(db_file)
    db.flush()

    record.is_portfolio = True
    db.commit()
    return {"message": "포트폴리오에 등록되었습니다", "model_file_id": db_file.id}


# ---------------------------------------------------------------------------
# DELETE /{image_id}
# ---------------------------------------------------------------------------

@router.delete("/{image_id}")
def delete_image(
    image_id: int,
    db: Session = Depends(get_db),
    _: Any = Depends(require_permission("image", "delete")),
):
    record = db.query(ModelSearchImage).filter(ModelSearchImage.id == image_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Image record not found")

    if record.local_path:
        try:
            (_UPLOAD / record.local_path).unlink(missing_ok=True)
        except Exception:
            pass

    db.delete(record)
    db.commit()
    return {"message": "삭제되었습니다"}

