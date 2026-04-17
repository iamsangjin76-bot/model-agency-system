# -*- coding: utf-8 -*-
"""
캐스팅 API 라우터
Casting API Router
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Date, JSON, Enum as SQLEnum, ForeignKey, or_
from typing import Optional, List
import math
from datetime import datetime, date
import enum

from app.config import settings
from app.models.database import get_db, Base
from app.schemas import CastingCreate, CastingUpdate, CastingStatusEnum, CastingTypeEnum
from app.routers.auth import require_permission

router = APIRouter()


# Enums
class CastingStatus(enum.Enum):
    REQUEST = "request"
    REVIEWING = "reviewing"
    MATCHING = "matching"
    PROPOSED = "proposed"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CastingType(enum.Enum):
    CF = "cf"
    MAGAZINE = "magazine"
    EVENT = "event"
    SHOW = "show"
    DRAMA = "drama"
    MOVIE = "movie"
    OTHER = "other"


class Casting(Base):
    __tablename__ = "castings"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    type = Column(SQLEnum(CastingType), default=CastingType.OTHER)
    status = Column(SQLEnum(CastingStatus), default=CastingStatus.REQUEST)
    client_id = Column(Integer, ForeignKey("clients.id"))
    budget = Column(Integer)
    shoot_date = Column(Date)
    location = Column(String(500))
    description = Column(Text)
    requirements = Column(JSON, default=[])
    deadline = Column(Date)
    proposed_models = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============ ENDPOINTS ============

@router.get("/stats/summary")
async def get_casting_stats(
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """캐스팅 통계"""
    Casting.__table__.create(db.get_bind(), checkfirst=True)

    total = db.query(Casting).filter(Casting.is_active == True).count()
    by_status = {}
    for status in CastingStatus:
        count = db.query(Casting).filter(Casting.status == status, Casting.is_active == True).count()
        by_status[status.value] = count

    return {"total": total, "by_status": by_status}


@router.get("")
async def list_castings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[CastingStatusEnum] = None,
    type: Optional[CastingTypeEnum] = None,
    budget_min: Optional[float] = None,
    budget_max: Optional[float] = None,
    shoot_date_from: Optional[date] = None,
    shoot_date_to: Optional[date] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """캐스팅 목록 조회"""
    Casting.__table__.create(db.get_bind(), checkfirst=True)
    
    query = db.query(Casting).filter(Casting.is_active == True)

    if search:
        query = query.filter(or_(Casting.title.ilike(f"%{search}%"), Casting.location.ilike(f"%{search}%"), Casting.description.ilike(f"%{search}%")))

    if status:
        query = query.filter(Casting.status == CastingStatus(status.value))
    
    if type:
        query = query.filter(Casting.type == CastingType(type.value))

    if budget_min is not None: query = query.filter(Casting.budget >= budget_min)
    if budget_max is not None: query = query.filter(Casting.budget <= budget_max)
    if shoot_date_from: query = query.filter(Casting.shoot_date >= shoot_date_from)
    if shoot_date_to: query = query.filter(Casting.shoot_date <= shoot_date_to)

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    _CAST_SORT = {"created_at": Casting.created_at, "shoot_date": Casting.shoot_date, "deadline": Casting.deadline, "budget": Casting.budget}
    _scol = _CAST_SORT.get(sort_by or "", Casting.created_at)
    castings = query.order_by(_scol.asc() if sort_order == "asc" else _scol.desc())\
                    .offset((page - 1) * page_size)\
                    .limit(page_size)\
                    .all()
    
    return {
        "items": [
            {
                "id": c.id,
                "title": c.title,
                "type": c.type.value if c.type else None,
                "status": c.status.value if c.status else None,
                "client_id": c.client_id,
                "budget": c.budget,
                "shoot_date": c.shoot_date.isoformat() if c.shoot_date else None,
                "location": c.location,
                "deadline": c.deadline.isoformat() if c.deadline else None,
                "proposed_models": c.proposed_models or [],
                "created_at": c.created_at
            }
            for c in castings
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{casting_id}")
async def get_casting(
    casting_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """캐스팅 상세 조회"""
    casting = db.query(Casting).filter(Casting.id == casting_id, Casting.is_active == True).first()
    if not casting:
        raise HTTPException(status_code=404, detail="캐스팅을 찾을 수 없습니다")

    return {
        "id": casting.id,
        "title": casting.title,
        "type": casting.type.value if casting.type else None,
        "status": casting.status.value if casting.status else None,
        "client_id": casting.client_id,
        "budget": casting.budget,
        "shoot_date": casting.shoot_date.isoformat() if casting.shoot_date else None,
        "location": casting.location,
        "description": casting.description,
        "requirements": casting.requirements or [],
        "deadline": casting.deadline.isoformat() if casting.deadline else None,
        "proposed_models": casting.proposed_models or [],
        "created_at": casting.created_at,
        "updated_at": casting.updated_at
    }


@router.post("")
async def create_casting(
    casting_data: CastingCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "create"))
):
    """캐스팅 등록"""
    Casting.__table__.create(db.get_bind(), checkfirst=True)
    
    db_casting = Casting(
        title=casting_data.title,
        type=CastingType(casting_data.type.value) if casting_data.type else CastingType.OTHER,
        client_id=casting_data.client_id,
        budget=casting_data.budget,
        shoot_date=casting_data.shoot_date,
        location=casting_data.location,
        description=casting_data.description,
        requirements=casting_data.requirements or [],
        deadline=casting_data.deadline
    )
    
    db.add(db_casting)
    db.commit()
    db.refresh(db_casting)
    
    return {"message": "캐스팅이 등록되었습니다", "id": db_casting.id}


@router.put("/{casting_id}")
async def update_casting(
    casting_id: int,
    casting_data: CastingUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "update"))
):
    """캐스팅 정보 수정"""
    casting = db.query(Casting).filter(Casting.id == casting_id, Casting.is_active == True).first()
    if not casting:
        raise HTTPException(status_code=404, detail="캐스팅을 찾을 수 없습니다")

    update_data = casting_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "status" and value:
            setattr(casting, key, CastingStatus(value.value))
        elif key == "type" and value:
            setattr(casting, key, CastingType(value.value))
        elif value is not None:
            setattr(casting, key, value)
    
    db.commit()
    db.refresh(casting)
    
    return {"message": "캐스팅 정보가 수정되었습니다", "id": casting_id}


@router.patch("/{casting_id}/status")
async def update_casting_status(
    casting_id: int,
    status: CastingStatusEnum,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "update"))
):
    """캐스팅 상태 변경"""
    casting = db.query(Casting).filter(Casting.id == casting_id, Casting.is_active == True).first()
    if not casting:
        raise HTTPException(status_code=404, detail="캐스팅을 찾을 수 없습니다")

    casting.status = CastingStatus(status.value)
    db.commit()
    
    return {"message": "상태가 변경되었습니다", "status": status.value}


@router.post("/{casting_id}/propose-model")
async def propose_model(
    casting_id: int,
    model_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "update"))
):
    """모델 제안"""
    casting = db.query(Casting).filter(Casting.id == casting_id, Casting.is_active == True).first()
    if not casting:
        raise HTTPException(status_code=404, detail="캐스팅을 찾을 수 없습니다")
    
    proposed = casting.proposed_models or []
    if model_id not in [m.get("id") for m in proposed]:
        proposed.append({"id": model_id, "status": "proposed", "proposed_at": datetime.utcnow().isoformat()})
        casting.proposed_models = proposed
        db.commit()
    
    return {"message": "모델이 제안되었습니다"}


@router.delete("/{casting_id}")
async def delete_casting(
    casting_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "delete"))
):
    """캐스팅 삭제 (soft delete)"""
    casting = db.query(Casting).filter(
        Casting.id == casting_id, Casting.is_active == True
    ).first()
    if not casting:
        raise HTTPException(status_code=404, detail="캐스팅을 찾을 수 없습니다")

    if casting.status == CastingStatus.CONFIRMED:
        raise HTTPException(
            status_code=409,
            detail="확정된 캐스팅은 삭제할 수 없습니다. 먼저 상태를 변경해 주세요."
        )

    casting.is_active = False
    db.commit()

    return {"message": "캐스팅이 삭제되었습니다", "id": casting_id}
