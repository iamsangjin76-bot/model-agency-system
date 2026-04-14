# -*- coding: utf-8 -*-
"""
고객(광고주) API 라우터
Client API Router
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Enum as SQLEnum, or_
from typing import Optional
import math
from datetime import datetime
import enum

from app.config import settings
from app.models.database import get_db, Base
from app.schemas import ClientCreate, ClientUpdate, ClientResponse, ClientGradeEnum, IndustryEnum
from app.routers.auth import get_current_active_user, require_permission

router = APIRouter()


# Client 모델 정의 (database.py에 없으면 여기서 정의)
class ClientGrade(enum.Enum):
    VIP = "vip"
    GOLD = "gold"
    SILVER = "silver"
    NORMAL = "normal"


class Industry(enum.Enum):
    COSMETICS = "cosmetics"
    FASHION = "fashion"
    FOOD = "food"
    ELECTRONICS = "electronics"
    AUTOMOBILE = "automobile"
    ENTERTAINMENT = "entertainment"
    RETAIL = "retail"
    OTHER = "other"


class Client(Base):
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    industry = Column(SQLEnum(Industry), default=Industry.OTHER)
    grade = Column(SQLEnum(ClientGrade), default=ClientGrade.NORMAL)
    contact_name = Column(String(100), nullable=False)
    contact_position = Column(String(100))
    phone = Column(String(20), nullable=False)
    email = Column(String(100))
    address = Column(Text)
    website = Column(String(200))
    memo = Column(Text)
    is_favorite = Column(Boolean, default=False)
    total_projects = Column(Integer, default=0)
    total_amount = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============ ENDPOINTS ============

@router.get("")
async def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    grade: Optional[ClientGradeEnum] = None,
    industry: Optional[IndustryEnum] = None,
    is_favorite: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """고객 목록 조회"""
    # 테이블 생성 확인
    Client.__table__.create(db.get_bind(), checkfirst=True)
    
    query = db.query(Client).filter(Client.is_active == True)
    
    if search:
        query = query.filter(
            or_(
                Client.name.ilike(f"%{search}%"),
                Client.contact_name.ilike(f"%{search}%")
            )
        )
    
    if grade:
        query = query.filter(Client.grade == ClientGrade(grade.value))
    
    if industry:
        query = query.filter(Client.industry == Industry(industry.value))
    
    if is_favorite is not None:
        query = query.filter(Client.is_favorite == is_favorite)
    
    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    clients = query.order_by(Client.created_at.desc())\
                   .offset((page - 1) * page_size)\
                   .limit(page_size)\
                   .all()
    
    return {
        "items": [
            {
                "id": c.id,
                "name": c.name,
                "industry": c.industry.value if c.industry else None,
                "grade": c.grade.value if c.grade else None,
                "contact_name": c.contact_name,
                "contact_position": c.contact_position,
                "phone": c.phone,
                "email": c.email,
                "is_favorite": c.is_favorite,
                "total_projects": c.total_projects,
                "total_amount": c.total_amount,
                "created_at": c.created_at
            }
            for c in clients
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{client_id}")
async def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """고객 상세 조회"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다")
    
    return {
        "id": client.id,
        "name": client.name,
        "industry": client.industry.value if client.industry else None,
        "grade": client.grade.value if client.grade else None,
        "contact_name": client.contact_name,
        "contact_position": client.contact_position,
        "phone": client.phone,
        "email": client.email,
        "address": client.address,
        "website": client.website,
        "memo": client.memo,
        "is_favorite": client.is_favorite,
        "total_projects": client.total_projects,
        "total_amount": client.total_amount,
        "is_active": client.is_active,
        "created_at": client.created_at,
        "updated_at": client.updated_at
    }


@router.post("")
async def create_client(
    client_data: ClientCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "create"))
):
    """고객 등록"""
    Client.__table__.create(db.get_bind(), checkfirst=True)
    
    db_client = Client(
        name=client_data.name,
        industry=Industry(client_data.industry.value) if client_data.industry else Industry.OTHER,
        grade=ClientGrade(client_data.grade.value) if client_data.grade else ClientGrade.NORMAL,
        contact_name=client_data.contact_name,
        contact_position=client_data.contact_position,
        phone=client_data.phone,
        email=client_data.email,
        address=client_data.address,
        website=client_data.website,
        memo=client_data.memo
    )
    
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    
    return {"message": "고객이 등록되었습니다", "id": db_client.id}


@router.put("/{client_id}")
async def update_client(
    client_id: int,
    client_data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "update"))
):
    """고객 정보 수정"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다")
    
    update_data = client_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "grade" and value:
            setattr(client, key, ClientGrade(value.value))
        elif key == "industry" and value:
            setattr(client, key, Industry(value.value))
        elif value is not None:
            setattr(client, key, value)
    
    db.commit()
    db.refresh(client)
    
    return {"message": "고객 정보가 수정되었습니다", "id": client_id}


@router.delete("/{client_id}")
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "delete"))
):
    """고객 삭제 (소프트 삭제)"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다")
    
    client.is_active = False
    db.commit()
    
    return {"message": "고객이 삭제되었습니다", "id": client_id}


@router.patch("/{client_id}/favorite")
async def toggle_favorite(
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "update"))
):
    """즐겨찾기 토글"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="고객을 찾을 수 없습니다")
    
    client.is_favorite = not client.is_favorite
    db.commit()
    
    return {"message": "즐겨찾기가 변경되었습니다", "is_favorite": client.is_favorite}
