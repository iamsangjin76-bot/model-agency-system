# -*- coding: utf-8 -*-
"""Model API Router"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import date
import os, math, re

from app.config import settings
from app.models.database import get_db, Model, ModelFile, ModelType, Gender
from app.schemas import (
    ModelCreate, ModelUpdate, ModelResponse,
    ModelTypeEnum, GenderEnum, PaginatedResponse
)
from app.schemas_detail import ModelDetailResponse
from app.routers.auth import require_permission
from app.services.notification_service import notify_all_admins

router = APIRouter()


@router.get("/stats/summary")
async def get_model_stats(
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """Model statistics"""
    total = db.query(Model).filter(Model.is_active == True).count()
    by_type = {mt.value: db.query(Model).filter(Model.model_type == mt, Model.is_active == True).count() for mt in ModelType}
    by_gender = {g.value: db.query(Model).filter(Model.gender == g, Model.is_active == True).count() for g in Gender}
    return {"total": total, "by_type": by_type, "by_gender": by_gender}


@router.get("", response_model=PaginatedResponse)
async def list_models(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    model_type: Optional[ModelTypeEnum] = None,
    gender: Optional[GenderEnum] = None,
    is_active: Optional[bool] = True,
    height_min: Optional[float] = None,
    height_max: Optional[float] = None,
    age_range: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """List models with search, filters, pagination"""
    query = db.query(Model)

    # Search filter — name, english name, keywords, hobby
    if search:
        query = query.filter(or_(
            Model.name.ilike(f"%{search}%"),
            Model.name_english.ilike(f"%{search}%"),
            Model.keywords.ilike(f"%{search}%"),
            Model.hobby.ilike(f"%{search}%"),
        ))
    if model_type:
        query = query.filter(Model.model_type == ModelType(model_type.value))
    if gender:
        query = query.filter(Model.gender == Gender(gender.value))
    if is_active is not None:
        query = query.filter(Model.is_active == is_active)
    if height_min is not None:
        query = query.filter(Model.height >= height_min)
    if height_max is not None:
        query = query.filter(Model.height <= height_max)

    # Age range filter — e.g. "20대" → 20~29, "50대 이상" → 50+
    if age_range:
        m = re.match(r"(\d+)", age_range)
        if m:
            decade = int(m.group(1))
            today = date.today()
            born_before = today.replace(year=today.year - decade)
            query = query.filter(Model.birth_date != None, Model.birth_date <= born_before)
            if "이상" not in age_range:
                born_after = today.replace(year=today.year - decade - 10)
                query = query.filter(Model.birth_date > born_after)

    total = query.count()
    total_pages = math.ceil(total / page_size)

    _MODEL_SORT = {"created_at": Model.created_at, "name": Model.name, "height": Model.height}
    _scol = _MODEL_SORT.get(sort_by or "", Model.created_at)
    models = query.order_by(_scol.asc() if sort_order == "asc" else _scol.desc())\
                  .offset((page - 1) * page_size).limit(page_size).all()

    result_items = []
    for model in models:
        profile_image = db.query(ModelFile).filter(
            ModelFile.model_id == model.id, ModelFile.is_profile_image == True
        ).first()
        result_items.append({
            "id": model.id, "name": model.name,
            "name_english": model.name_english,
            "model_type": model.model_type.value if model.model_type else None,
            "gender": model.gender.value if model.gender else None,
            "height": model.height,
            "instagram_followers": model.instagram_followers,
            "profile_image": f"/uploads/{profile_image.file_path}" if profile_image else None,
            "is_active": model.is_active, "created_at": model.created_at,
        })

    return {"items": result_items, "total": total, "page": page,
            "page_size": page_size, "total_pages": total_pages}


@router.get("/{model_id}", response_model=ModelDetailResponse)
async def get_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """Get model detail with full profile"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다")
    profile_image = db.query(ModelFile).filter(
        ModelFile.model_id == model.id, ModelFile.is_profile_image == True
    ).first()
    response = ModelDetailResponse.from_orm(model)
    if profile_image:
        response.profile_image = f"/uploads/{profile_image.file_path}"
    return response


@router.post("", response_model=ModelResponse)
async def create_model(
    model_data: ModelCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "create"))
):
    """Create a new model"""
    category_str = model_data.model_type.value if model_data.model_type else "unknown"
    folder_name = f"[{category_str}]_{model_data.name.replace(' ', '_')}"
    relative_folder_path = f"library/{folder_name}"
    os.makedirs(os.path.join(settings.UPLOAD_DIR, relative_folder_path), exist_ok=True)

    db_model = Model(**model_data.dict(), folder_path=relative_folder_path, created_by=current_user.id)
    if model_data.model_type:
        db_model.model_type = ModelType(model_data.model_type.value)
    if model_data.gender:
        db_model.gender = Gender(model_data.gender.value)
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    notify_all_admins(db, f"새 모델 등록: {db_model.name}", "model", "model", db_model.id, link_url="/dashboard/models", exclude_admin_id=current_user.id)
    db.commit()
    return db_model


@router.put("/{model_id}", response_model=ModelResponse)
async def update_model(
    model_id: int,
    model_data: ModelUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "update"))
):
    """Update model fields"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다")
    for key, value in model_data.dict(exclude_unset=True).items():
        if value is None:
            continue
        if key == "model_type":
            setattr(model, key, ModelType(value.value))
        elif key == "gender":
            setattr(model, key, Gender(value.value))
        else:
            setattr(model, key, value)
    db.commit()
    db.refresh(model)
    return model


@router.delete("/{model_id}")
async def delete_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "delete"))
):
    """Soft-delete a model"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다")
    model.is_active = False
    db.commit()
    return {"message": "모델이 삭제되었습니다", "id": model_id}


@router.get("/{model_id}/files")
async def get_model_files(
    model_id: int,
    file_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """List files attached to a model"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다")
    query = db.query(ModelFile).filter(ModelFile.model_id == model_id)
    if file_type:
        query = query.filter(ModelFile.file_type == file_type)
    files = query.order_by(ModelFile.display_order).all()
    return [
        {"id": f.id, "file_name": f.file_name, "file_path": f"/uploads/{f.file_path}",
         "file_type": f.file_type, "file_size": f.file_size,
         "is_profile_image": f.is_profile_image, "created_at": f.created_at}
        for f in files
    ]


@router.patch("/{model_id}/files/{file_id}/set-profile")
async def set_profile_image(
    model_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "update"))
):
    """Set a ModelFile as the profile image (unsets all others for this model)."""
    target = db.query(ModelFile).filter(
        ModelFile.id == file_id, ModelFile.model_id == model_id
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다")
    db.query(ModelFile).filter(
        ModelFile.model_id == model_id, ModelFile.is_profile_image == True  # noqa: E712
    ).update({"is_profile_image": False})
    target.is_profile_image = True
    db.commit()
    return {"ok": True, "profile_file_id": file_id,
            "profile_image": f"/uploads/{target.file_path}"}


@router.delete("/bulk")
async def bulk_delete_models(
    model_ids: List[int],
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "delete"))
):
    """Bulk soft-delete models"""
    deleted_count = 0
    for mid in model_ids:
        model = db.query(Model).filter(Model.id == mid).first()
        if model:
            model.is_active = False
            db.commit()
            deleted_count += 1
    return {"deleted_count": deleted_count, "model_ids": model_ids}
