# -*- coding: utf-8 -*-
"""
Media router package.

Exposes a single `router` that combines image and news sub-routers.
main.py mounts this at /api/media — all existing URL paths are preserved.
"""

from fastapi import APIRouter

from .images import router as _image_router
from .news import router as _news_router

router = APIRouter()
router.include_router(_image_router)
router.include_router(_news_router)

__all__ = ["router"]
