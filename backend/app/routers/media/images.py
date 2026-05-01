# -*- coding: utf-8 -*-
"""
Image search and save endpoints.

Routes:
  POST /images/search  — search via Unsplash or Bing
  POST /images/save    — download and persist images for a model
"""

from __future__ import annotations

import os
from datetime import datetime
from enum import Enum
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import Model, ModelFile, get_db
from app.routers.auth import require_permission

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ImageSourceEnum(str, Enum):
    UNSPLASH = "unsplash"
    BING = "bing"
    LOCAL = "local"


class ImageSearchResponse(BaseModel):
    """Single image search result."""
    id: str
    url: str
    thumbnail_url: str
    title: str
    source: str
    width: int
    height: int
    license: Optional[str] = None
    author_name: Optional[str] = None
    author_url: Optional[str] = None


class ImageSearchRequest(BaseModel):
    """Image search request payload."""
    query: str
    source: ImageSourceEnum = ImageSourceEnum.UNSPLASH
    page: int = 1
    per_page: int = 20


class SaveImagesRequest(BaseModel):
    """Payload for saving selected images to a model folder."""
    model_id: int
    image_urls: List[str]
    is_profile: bool = False


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def search_unsplash(query: str, page: int = 1, per_page: int = 20) -> List[ImageSearchResponse]:
    """Search images via the Unsplash API (falls back to demo data if unconfigured)."""
    api_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if not api_key:
        return _demo_images(query, per_page)

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://api.unsplash.com/search/photos",
                headers={"Authorization": f"Client-ID {api_key}"},
                params={"query": query, "page": page, "per_page": per_page, "orientation": "portrait"},
                timeout=10.0,
            )
            resp.raise_for_status()
            return [
                ImageSearchResponse(
                    id=p["id"], url=p["urls"]["regular"], thumbnail_url=p["urls"]["thumb"],
                    title=p.get("alt_description", f"{query} 이미지"), source="Unsplash",
                    width=p["width"], height=p["height"],
                    license=p.get("license", "Unsplash License"),
                    author_name=p["user"]["name"], author_url=p["user"]["links"]["html"],
                )
                for p in resp.json().get("results", [])
            ]
        except Exception as e:
            print(f"Unsplash API error: {e}")
            return _demo_images(query, per_page)


async def search_bing(query: str, page: int = 1, per_page: int = 20) -> List[ImageSearchResponse]:
    """Search images via the Bing Image Search API (falls back to demo data if unconfigured)."""
    api_key = os.getenv("BING_SEARCH_API_KEY")
    if not api_key:
        return _demo_images(query, per_page)

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://api.bing.microsoft.com/v7.0/images/search",
                headers={"Ocp-Apim-Subscription-Key": api_key},
                params={"q": query, "offset": (page - 1) * per_page, "count": per_page,
                        "imageType": "Photo", "license": "Public"},
                timeout=10.0,
            )
            resp.raise_for_status()
            return [
                ImageSearchResponse(
                    id=f"bing-{r.get('imageId', idx)}",
                    url=r["contentUrl"], thumbnail_url=r["thumbnailUrl"],
                    title=r.get("name", f"{query} 이미지"), source="Bing",
                    width=r.get("width", 0), height=r.get("height", 0),
                    license=r.get("license", "Unknown"),
                    author_name=r.get("creator", {}).get("name"),
                    author_url=r.get("creator", {}).get("url"),
                )
                for idx, r in enumerate(resp.json().get("value", [])[:per_page])
            ]
        except Exception as e:
            print(f"Bing API error: {e}")
            return _demo_images(query, per_page)


_DEMO_SLUGS = [
    "photo-1534528741775-53994a69daeb", "photo-1517841905240-472988babdf9",
    "photo-1524504388940-b1c1722653e1", "photo-1529626455594-4ff0802cfb7e",
    "photo-1507003211169-0a1dd7228f2d", "photo-1506794778202-cad84cf45f1d",
    "photo-1531746020798-e6953c6e8e04", "photo-1488426862026-3ee34a7d66df",
    "photo-1494790108377-be9c29b29330", "photo-1531123897727-8f129e1688ce",
]


def _demo_images(query: str, count: int = 20) -> List[ImageSearchResponse]:
    """Return placeholder images when no API key is configured."""
    return [
        ImageSearchResponse(
            id=f"demo-{i + 1}",
            url=f"https://images.unsplash.com/{_DEMO_SLUGS[i % len(_DEMO_SLUGS)]}?w=800&h=1200&fit=crop",
            thumbnail_url=f"https://images.unsplash.com/{_DEMO_SLUGS[i % len(_DEMO_SLUGS)]}?w=300&h=400&fit=crop",
            title=f"{query} 이미지 {i + 1}", source="Unsplash (Demo)",
            width=800, height=1200, license="Unsplash License", author_name="Demo User",
        )
        for i in range(min(count, len(_DEMO_SLUGS)))
    ]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/images/search", response_model=List[ImageSearchResponse])
async def search_images(
    request: ImageSearchRequest,
    current_user=Depends(require_permission("model", "read")),
):
    """Search images from Unsplash or Bing."""
    if request.source == ImageSourceEnum.UNSPLASH:
        return await search_unsplash(request.query, request.page, request.per_page)
    if request.source == ImageSourceEnum.BING:
        return await search_bing(request.query, request.page, request.per_page)
    raise HTTPException(status_code=400, detail="지원하지 않는 소스입니다")


@router.post("/images/save")
async def save_images(
    request: SaveImagesRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("model", "create")),
):
    """Download selected images and attach them to a model."""
    model = db.query(Model).filter(Model.id == request.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다")

    folder_path = (
        f"library/[{model.model_type.value if model.model_type else 'Unknown'}]"
        f"_{model.name.replace(' ', '_')}"
    )
    save_dir = os.path.join(settings.UPLOAD_DIR, folder_path)
    os.makedirs(save_dir, exist_ok=True)

    saved: list[str] = []
    async with httpx.AsyncClient() as client:
        for idx, url in enumerate(request.image_urls):
            try:
                resp = await client.get(url, timeout=30.0)
                resp.raise_for_status()
                ct = resp.headers.get("content-type", "")
                ext = ".png" if "png" in ct else (".webp" if "webp" in ct else ".jpg")
                fname = f"image_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{idx + 1}{ext}"
                fpath = os.path.join(save_dir, fname)
                with open(fpath, "wb") as f:
                    f.write(resp.content)
                db.add(ModelFile(
                    model_id=request.model_id,
                    file_name=fname,
                    file_path=f"{folder_path}/{fname}",
                    file_type="image",
                    file_size=len(resp.content),
                    is_profile_image=request.is_profile and idx == 0,
                    uploaded_by=current_user.id,
                ))
                saved.append(fname)
            except Exception as e:
                print(f"Failed to save image {url}: {e}")

    db.commit()
    return {"message": f"{len(saved)}개 이미지 저장 완료", "saved_count": len(saved),
            "model_id": request.model_id}
