# -*- coding: utf-8 -*-
"""
모델 API 라우터
Model API Router
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
import os
import math

from app.config import settings
from app.models.database import get_db, Model, ModelFile, ModelType, Gender
from app.schemas import (
    ModelCreate, ModelUpdate, ModelResponse, ModelListResponse,
    ModelTypeEnum, GenderEnum, PaginatedResponse
)
from app.routers.auth import get_current_active_user, require_permission

router = APIRouter()


# ============ CRUD OPERATIONS ============

@router.get("/stats/summary")
async def get_model_stats(
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """모델 통계"""
    total = db.query(Model).filter(Model.is_active == True).count()

    by_type = {}
    for model_type in ModelType:
        count = db.query(Model).filter(
            Model.model_type == model_type,
            Model.is_active == True
        ).count()
        by_type[model_type.value] = count

    # Aggregate model count by gender
    by_gender = {}
    for gender in Gender:
        count = db.query(Model).filter(
            Model.gender == gender,
            Model.is_active == True
        ).count()
        by_gender[gender.value] = count

    return {
        "total": total,
        "by_type": by_type,
        "by_gender": by_gender
    }


@router.get("", response_model=PaginatedResponse)
async def list_models(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    model_type: Optional[ModelTypeEnum] = None,
    gender: Optional[GenderEnum] = None,
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """모델 목록 조회"""
    query = db.query(Model)
    
    # 필터링
    if search:
        query = query.filter(
            or_(
                Model.name.ilike(f"%{search}%"),
                Model.name_english.ilike(f"%{search}%"),
                Model.keywords.ilike(f"%{search}%")
            )
        )
    
    if model_type:
        query = query.filter(Model.model_type == ModelType(model_type.value))
    
    if gender:
        query = query.filter(Model.gender == gender.value)
    
    if is_active is not None:
        query = query.filter(Model.is_active == is_active)
    
    # 전체 개수
    total = query.count()
    total_pages = math.ceil(total / page_size)
    
    # 페이지네이션
    models = query.order_by(Model.created_at.desc())\
                  .offset((page - 1) * page_size)\
                  .limit(page_size)\
                  .all()
    
    # 프로필 이미지 추가
    result_items = []
    for model in models:
        model_dict = {
            "id": model.id,
            "name": model.name,
            "name_english": model.name_english,
            "model_type": model.model_type.value if model.model_type else None,
            "gender": model.gender.value if model.gender else None,
            "height": model.height,
            "instagram_followers": model.instagram_followers,
            "profile_image": None,
            "is_active": model.is_active,
            "created_at": model.created_at
        }
        
        # 프로필 이미지 조회
        profile_image = db.query(ModelFile).filter(
            ModelFile.model_id == model.id,
            ModelFile.is_profile_image == True
        ).first()
        if profile_image:
            model_dict["profile_image"] = f"/uploads/{profile_image.file_path}"
        
        result_items.append(model_dict)
    
    return {
        "items": result_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{model_id}", response_model=ModelResponse)
async def get_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """모델 상세 조회"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다")
    
    # 프로필 이미지 조회
    profile_image = db.query(ModelFile).filter(
        ModelFile.model_id == model.id,
        ModelFile.is_profile_image == True
    ).first()
    
    response = ModelResponse.from_orm(model)
    if profile_image:
        response.profile_image = f"/uploads/{profile_image.file_path}"
    
    return response


@router.post("", response_model=ModelResponse)
async def create_model(
    model_data: ModelCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "create"))
):
    """모델 등록"""
    # 모델 폴더 경로 생성 (라이브러리 구조: uploads/library/[Category]_Name)
    category_str = model_data.model_type.value if model_data.model_type else "unknown"
    folder_name = f"[{category_str}]_{model_data.name.replace(' ', '_')}"
    relative_folder_path = f"library/{folder_name}"
    absolute_folder_path = os.path.join(settings.UPLOAD_DIR, relative_folder_path)
    os.makedirs(absolute_folder_path, exist_ok=True)
    
    # 모델 생성
    db_model = Model(
        **model_data.dict(),
        folder_path=relative_folder_path,
        created_by=current_user.id
    )
    
    # model_type enum 변환
    if model_data.model_type:
        db_model.model_type = ModelType(model_data.model_type.value)
    
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    
    return db_model


@router.put("/{model_id}", response_model=ModelResponse)
async def update_model(
    model_id: int,
    model_data: ModelUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "update"))
):
    """모델 정보 수정"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다")
    
    update_data = model_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "model_type" and value:
            setattr(model, key, ModelType(value.value))
        elif value is not None:
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
    """모델 삭제 (소프트 삭제)"""
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
    """모델 파일 목록 조회"""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다")
    
    query = db.query(ModelFile).filter(ModelFile.model_id == model_id)
    
    if file_type:
        query = query.filter(ModelFile.file_type == file_type)
    
    files = query.order_by(ModelFile.display_order).all()
    
    return [
        {
            "id": f.id,
            "file_name": f.file_name,
            "file_path": f"/uploads/{f.file_path}",
            "file_type": f.file_type,
            "file_size": f.file_size,
            "is_profile_image": f.is_profile_image,
            "created_at": f.created_at
        }
        for f in files
    ]




@router.delete("/bulk")
async def bulk_delete_models(
    model_ids: List[int],
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "delete"))
):
    """일괄 모델 삭제"""
    deleted_count = 0
    for model_id in model_ids:
        model = db.query(Model).filter(Model.id == model_id).first()
        if model:
            model.is_active = False
            db.commit()
            deleted_count += 1
    
    return {"deleted_count": deleted_count, "model_ids": model_ids}
