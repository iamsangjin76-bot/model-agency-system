# -*- coding: utf-8 -*-
"""
계약 API 라우터
Contract API Router
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Enum as SQLEnum, ForeignKey, or_
from typing import Optional
import math
from datetime import datetime, date
import enum

from app.config import settings
from app.models.database import get_db, Base
from app.schemas import ContractCreate, ContractUpdate, ContractStatusEnum, ContractTypeEnum
from app.routers.auth import require_permission
from app.utils.activity_log import log_activity

router = APIRouter()


class ContractStatus(enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"


class ContractType(enum.Enum):
    EXCLUSIVE = "exclusive"
    PROJECT = "project"
    ANNUAL = "annual"
    EVENT = "event"


class Contract(Base):
    __tablename__ = "contracts"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_number = Column(String(50), unique=True, index=True)
    title = Column(String(300), nullable=False)
    type = Column(SQLEnum(ContractType), default=ContractType.PROJECT)
    status = Column(SQLEnum(ContractStatus), default=ContractStatus.DRAFT)
    model_id = Column(Integer, ForeignKey("models.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    amount = Column(Integer, nullable=False)
    agency_fee = Column(Integer)
    model_fee = Column(Integer)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    signed_date = Column(Date)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def generate_contract_number(db: Session) -> str:
    """계약 번호 생성"""
    year = datetime.now().year
    last = db.query(Contract).filter(
        Contract.contract_number.like(f"CT-{year}-%")
    ).order_by(Contract.id.desc()).first()
    
    if last and last.contract_number:
        num = int(last.contract_number.split("-")[-1]) + 1
    else:
        num = 1
    
    return f"CT-{year}-{str(num).zfill(4)}"


@router.get("/stats/summary")
async def get_contract_stats(
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """계약 통계"""
    Contract.__table__.create(db.get_bind(), checkfirst=True)

    total = db.query(Contract).count()
    active = db.query(Contract).filter(Contract.status == ContractStatus.ACTIVE).count()

    total_amount = 0
    contracts = db.query(Contract).filter(Contract.status == ContractStatus.ACTIVE).all()
    for c in contracts:
        if c.amount:
            total_amount += c.amount

    return {
        "total": total,
        "active": active,
        "total_amount": total_amount
    }


@router.get("")
async def list_contracts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[ContractStatusEnum] = None,
    type: Optional[ContractTypeEnum] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """계약 목록 조회"""
    Contract.__table__.create(db.get_bind(), checkfirst=True)
    
    query = db.query(Contract)
    
    if search:
        query = query.filter(
            or_(
                Contract.title.ilike(f"%{search}%"),
                Contract.contract_number.ilike(f"%{search}%")
            )
        )
    
    if status:
        query = query.filter(Contract.status == ContractStatus(status.value))
    
    if type:
        query = query.filter(Contract.type == ContractType(type.value))
    
    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    contracts = query.order_by(Contract.created_at.desc())\
                     .offset((page - 1) * page_size)\
                     .limit(page_size)\
                     .all()
    
    return {
        "items": [
            {
                "id": c.id,
                "contract_number": c.contract_number,
                "title": c.title,
                "contract_type": c.type.value if c.type else None,
                "type": c.type.value if c.type else None,
                "status": c.status.value if c.status else None,
                "model_id": c.model_id,
                "model_name": None,
                "client_id": c.client_id,
                "client_name": None,
                "total_amount": c.amount,
                "amount": c.amount,
                "agency_fee": c.agency_fee,
                "model_fee": c.model_fee,
                "start_date": c.start_date.isoformat() if c.start_date else None,
                "end_date": c.end_date.isoformat() if c.end_date else None,
                "signed_date": c.signed_date.isoformat() if c.signed_date else None,
                "memo": c.description,
                "created_at": c.created_at
            }
            for c in contracts
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{contract_id}")
async def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """계약 상세 조회"""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")
    
    return {
        "id": contract.id,
        "contract_number": contract.contract_number,
        "title": contract.title,
        "type": contract.type.value if contract.type else None,
        "status": contract.status.value if contract.status else None,
        "model_id": contract.model_id,
        "client_id": contract.client_id,
        "amount": contract.amount,
        "agency_fee": contract.agency_fee,
        "model_fee": contract.model_fee,
        "start_date": contract.start_date.isoformat() if contract.start_date else None,
        "end_date": contract.end_date.isoformat() if contract.end_date else None,
        "signed_date": contract.signed_date.isoformat() if contract.signed_date else None,
        "description": contract.description,
        "created_at": contract.created_at,
        "updated_at": contract.updated_at
    }


@router.post("")
async def create_contract(
    contract_data: ContractCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "create"))
):
    """계약 등록"""
    Contract.__table__.create(db.get_bind(), checkfirst=True)

    # contract_type 우선, 없으면 type 사용
    ct_val = contract_data.contract_type or contract_data.type
    resolved_type = ContractType(ct_val.value) if ct_val else ContractType.PROJECT

    # total_amount 우선, 없으면 amount 사용
    amount = contract_data.total_amount or contract_data.amount or 0

    # description/memo 병합
    desc = contract_data.description or contract_data.memo

    # status
    status_val = ContractStatus(contract_data.status.value) if contract_data.status else ContractStatus.DRAFT

    db_contract = Contract(
        contract_number=generate_contract_number(db),
        title=contract_data.title or "계약",
        type=resolved_type,
        status=status_val,
        model_id=contract_data.model_id,
        client_id=contract_data.client_id,
        amount=amount,
        agency_fee=contract_data.agency_fee,
        model_fee=contract_data.model_fee,
        start_date=contract_data.start_date,
        end_date=contract_data.end_date,
        description=desc,
    )

    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    try:
        log_activity(db, current_user.id, "create", "contract", db_contract.id, db_contract.title, details=f"계약 {db_contract.title} 등록")
    except Exception:
        pass  # log failure must not break main operation
    return {"message": "계약이 등록되었습니다", "id": db_contract.id, "contract_number": db_contract.contract_number}


@router.put("/{contract_id}")
async def update_contract(
    contract_id: int,
    contract_data: ContractUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "update"))
):
    """계약 정보 수정"""
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다")
    
    update_data = contract_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "status" and value:
            setattr(contract, key, ContractStatus(value.value))
        elif key == "type" and value:
            setattr(contract, key, ContractType(value.value))
        elif value is not None:
            setattr(contract, key, value)
    
    db.commit()
    db.refresh(contract)
    try:
        log_activity(db, current_user.id, "update", "contract", contract_id, contract.title, details=f"계약 {contract.title} 수정")
    except Exception:
        pass  # log failure must not break main operation
    return {"message": "계약 정보가 수정되었습니다", "id": contract_id}


