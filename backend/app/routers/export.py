# -*- coding: utf-8 -*-
"""
Export Router — PPTX profile generation.

POST /api/export/pptx
  Body: { "model_ids": [1, 2, 3], "template": "new_model_a" }
  → StreamingResponse (.pptx download)
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.models.database import get_db, Model
from app.routers.auth import require_permission
from app.config import settings

router = APIRouter()

VALID_TEMPLATES = {"new_model_a", "new_model_b", "influencer", "foreign_model"}
TEMPLATE_LABELS = {
    "new_model_a": "신인모델 A타입",
    "new_model_b": "신인모델 B타입",
    "influencer": "인플루언서",
    "foreign_model": "외국인모델",
}


class PptxRequest(BaseModel):
    model_ids: list[int] = Field(..., min_length=1, max_length=20)
    template: str = "new_model_a"


@router.post("/pptx")
async def export_pptx(
    req: PptxRequest,
    db: Session = Depends(get_db),
    _: Any = Depends(require_permission("models", "view")),
):
    """Generate a PPTX presentation with model profiles."""
    if req.template not in VALID_TEMPLATES:
        raise HTTPException(
            status_code=422,
            detail=f"template must be one of: {', '.join(sorted(VALID_TEMPLATES))}",
        )

    # Fetch models (preserve order)
    id_map: dict[int, Model] = {
        m.id: m
        for m in db.query(Model).filter(Model.id.in_(req.model_ids)).all()
    }
    models = [id_map[mid] for mid in req.model_ids if mid in id_map]

    if not models:
        raise HTTPException(status_code=404, detail="선택한 모델을 찾을 수 없습니다")

    # Import lazily to avoid startup cost when pptx not installed
    try:
        from app.services.pptx_service import build_pptx
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="python-pptx가 설치되지 않았습니다. pip install python-pptx 를 실행하세요.",
        )

    pptx_bytes = build_pptx(
        models,
        template=req.template,
        upload_dir=settings.UPLOAD_DIR,
        model_files_dir=settings.MODEL_FILES_DIR,
    )

    template_label = TEMPLATE_LABELS.get(req.template, req.template)
    filename = f"model_profiles_{template_label}.pptx"

    def _iter():
        yield pptx_bytes

    return StreamingResponse(
        _iter(),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
