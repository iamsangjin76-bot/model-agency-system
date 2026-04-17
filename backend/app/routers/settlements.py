# -*- coding: utf-8 -*-
"""
정산 API 라우터
Settlement API Router
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import Optional
import math

from app.models.database import get_db
from app.models.settlement import Settlement, SettlementStatus, SettlementType
from app.schemas import SettlementCreate, SettlementUpdate, SettlementStatusEnum, SettlementTypeEnum
from app.routers.auth import require_permission

router = APIRouter()


@router.get("/stats/summary")
async def get_settlement_stats(
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """정산 통계"""
    Settlement.__table__.create(db.get_bind(), checkfirst=True)

    total_income = 0
    total_expense = 0
    pending_amount = 0

    settlements = db.query(Settlement).filter(Settlement.is_active == True).all()
    for s in settlements:
        if s.type == SettlementType.AGENCY_FEE and s.status == SettlementStatus.COMPLETED:
            total_income += s.amount or 0
        elif s.type != SettlementType.AGENCY_FEE and s.status == SettlementStatus.COMPLETED:
            total_expense += s.amount or 0

        if s.status in [SettlementStatus.PENDING, SettlementStatus.PROCESSING]:
            pending_amount += s.amount or 0

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_profit": total_income - total_expense,
        "pending_count": db.query(Settlement).filter(
            Settlement.is_active == True,
            Settlement.status.in_([SettlementStatus.PENDING, SettlementStatus.PROCESSING])
        ).count(),
        "pending_amount": pending_amount
    }


@router.get("")
async def list_settlements(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[SettlementStatusEnum] = None,
    type: Optional[SettlementTypeEnum] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """정산 목록 조회"""
    Settlement.__table__.create(db.get_bind(), checkfirst=True)
    
    query = db.query(Settlement).filter(Settlement.is_active == True)

    if search:
        query = query.filter(Settlement.title.ilike(f"%{search}%"))
    
    if status:
        query = query.filter(Settlement.status == SettlementStatus(status.value))
    
    if type:
        query = query.filter(Settlement.type == SettlementType(type.value))
    
    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    
    settlements = query.order_by(Settlement.created_at.desc())\
                       .offset((page - 1) * page_size)\
                       .limit(page_size)\
                       .all()
    
    return {
        "items": [
            {
                "id": s.id,
                "title": s.title,
                "description": s.description,
                "settlement_type": s.type.value if s.type else None,
                "type": s.type.value if s.type else None,
                "status": s.status.value if s.status else None,
                "amount": s.amount,
                "contract_id": s.contract_id,
                "model_id": s.model_id,
                "client_id": s.client_id,
                "payment_date": s.paid_date.isoformat() if s.paid_date else (s.due_date.isoformat() if s.due_date else None),
                "due_date": s.due_date.isoformat() if s.due_date else None,
                "paid_date": s.paid_date.isoformat() if s.paid_date else None,
                "bank_info": s.bank_info,
                "created_at": s.created_at
            }
            for s in settlements
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{settlement_id}")
async def get_settlement(
    settlement_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """정산 상세 조회"""
    settlement = db.query(Settlement).filter(Settlement.id == settlement_id, Settlement.is_active == True).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="정산을 찾을 수 없습니다")

    return {
        "id": settlement.id,
        "title": settlement.title,
        "type": settlement.type.value if settlement.type else None,
        "status": settlement.status.value if settlement.status else None,
        "amount": settlement.amount,
        "contract_id": settlement.contract_id,
        "model_id": settlement.model_id,
        "client_id": settlement.client_id,
        "due_date": settlement.due_date.isoformat() if settlement.due_date else None,
        "paid_date": settlement.paid_date.isoformat() if settlement.paid_date else None,
        "bank_info": settlement.bank_info,
        "description": settlement.description,
        "created_at": settlement.created_at
    }


@router.post("")
async def create_settlement(
    settlement_data: SettlementCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "create"))
):
    """정산 등록"""
    from datetime import date as date_type

    Settlement.__table__.create(db.get_bind(), checkfirst=True)

    # settlement_type 우선, 없으면 type 사용
    st_val = settlement_data.settlement_type or settlement_data.type
    resolved_type = SettlementType(st_val.value) if st_val else SettlementType.EXPENSE

    # payment_date → paid_date / due_date fallback
    paid_date = None
    due_date = settlement_data.due_date or settlement_data.payment_date or date_type.today()
    if settlement_data.payment_date:
        paid_date = settlement_data.payment_date

    # status
    status_val = SettlementStatus(settlement_data.status.value) if settlement_data.status else SettlementStatus.PENDING

    db_settlement = Settlement(
        title=settlement_data.title or settlement_data.description or "정산",
        type=resolved_type,
        status=status_val,
        amount=settlement_data.amount,
        contract_id=settlement_data.contract_id,
        model_id=settlement_data.model_id,
        client_id=settlement_data.client_id,
        due_date=due_date,
        paid_date=paid_date,
        bank_info=settlement_data.bank_info,
        description=settlement_data.description,
    )

    db.add(db_settlement)
    db.commit()
    db.refresh(db_settlement)

    return {"message": "정산이 등록되었습니다", "id": db_settlement.id}


@router.put("/{settlement_id}")
async def update_settlement(
    settlement_id: int,
    settlement_data: SettlementUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "update"))
):
    """정산 정보 수정"""
    settlement = db.query(Settlement).filter(Settlement.id == settlement_id, Settlement.is_active == True).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="정산을 찾을 수 없습니다")

    update_data = settlement_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key == "status" and value:
            setattr(settlement, "status", SettlementStatus(value.value))
        elif key in ("type", "settlement_type") and value:
            setattr(settlement, "type", SettlementType(value.value))
        elif key == "payment_date" and value is not None:
            setattr(settlement, "paid_date", value)
        elif key not in ("settlement_type", "payment_date") and value is not None:
            setattr(settlement, key, value)
    
    db.commit()
    db.refresh(settlement)
    
    return {"message": "정산 정보가 수정되었습니다", "id": settlement_id}


@router.patch("/{settlement_id}/complete")
async def complete_settlement(
    settlement_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "update"))
):
    """정산 완료 처리"""
    from datetime import date
    
    settlement = db.query(Settlement).filter(Settlement.id == settlement_id, Settlement.is_active == True).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="정산을 찾을 수 없습니다")

    settlement.status = SettlementStatus.COMPLETED
    settlement.paid_date = date.today()
    db.commit()

    return {"message": "정산이 완료되었습니다"}


@router.delete("/{settlement_id}")
async def delete_settlement(
    settlement_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "delete"))
):
    """정산 삭제 (soft delete)"""
    s = db.query(Settlement).filter(Settlement.id == settlement_id, Settlement.is_active == True).first()
    if not s:
        raise HTTPException(status_code=404, detail="정산을 찾을 수 없습니다")
    s.is_active = False
    db.commit()
    return {"message": "정산이 삭제되었습니다"}


@router.get("/stats/monthly")
async def get_monthly_stats(
    months: int = Query(5, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """월별 수입/지출 집계"""
    from datetime import date
    Settlement.__table__.create(db.get_bind(), checkfirst=True)
    today = date.today()
    items = []
    for i in range(months - 1, -1, -1):
        m = (today.month - i - 1) % 12 + 1
        y = today.year + (today.month - i - 1) // 12
        rows = db.query(Settlement).filter(
            Settlement.is_active == True,
            Settlement.status == SettlementStatus.COMPLETED,
            extract("month", Settlement.paid_date) == m,
            extract("year", Settlement.paid_date) == y,
        ).all()
        income = sum(s.amount or 0 for s in rows if s.type == SettlementType.AGENCY_FEE)
        expense = sum(s.amount or 0 for s in rows if s.type != SettlementType.AGENCY_FEE)
        items.append({"month": f"{y}-{m:02d}", "label": f"{m}월", "income": income, "expense": expense})
    return {"items": items}


@router.get("/stats/expense-breakdown")
async def get_expense_breakdown(
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("model", "read"))
):
    """지출 유형별 비율"""
    Settlement.__table__.create(db.get_bind(), checkfirst=True)
    rows = db.query(Settlement).filter(
        Settlement.is_active == True,
        Settlement.status == SettlementStatus.COMPLETED,
        Settlement.type != SettlementType.AGENCY_FEE,
    ).all()
    totals: dict = {}
    for s in rows:
        k = s.type.value if s.type else "expense"
        totals[k] = totals.get(k, 0) + (s.amount or 0)
    grand = sum(totals.values())
    LABELS = {"model_payment": "모델료 지급", "expense": "비용", "refund": "환불"}
    items = [{"name": LABELS.get(k, k), "type": k, "amount": v,
              "percentage": round(v / grand * 100, 1) if grand else 0}
             for k, v in totals.items()]
    return {"items": items, "total": grand}
