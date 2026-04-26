# -*- coding: utf-8 -*-
"""
Image proxy router.

Exposes GET /api/proxy/image — proxies external images with SSRF defense.
Response headers are explicitly controlled; Set-Cookie and Content-Disposition
are never forwarded to prevent client-side side-effects.
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from fastapi.responses import Response

from app.config import settings
from app.services.image_proxy_service import fetch_proxied_image

router = APIRouter()


@router.get("/image", summary="Proxy an external image URL")
async def proxy_image(
    url: str = Query(..., description="Fully-qualified external image URL to proxy"),
) -> Response:
    data, content_type = await fetch_proxied_image(url)
    return Response(
        content=data,
        media_type=content_type,
        headers={
            "Cache-Control": f"public, max-age={settings.IMAGE_PROXY_CACHE_TTL}",
            "X-Content-Type-Options": "nosniff",
            # Intentionally omitted: Set-Cookie, Content-Disposition, etc.
        },
    )
