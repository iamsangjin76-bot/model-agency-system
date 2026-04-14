# coding: utf-8
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from app.models.database import get_db, ActivityLog
from app.routers.auth import get_current_active_user

router = APIRouter()

@router.get("")
async def get_activity_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    admin_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    query = db.query(ActivityLog)
    
    if action:
        query = query.filter(ActivityLog.action == action)
    if target_type:
        query = query.filter(ActivityLog.target_type == target_type)
    if admin_id:
        query = query.filter(ActivityLog.admin_id == admin_id)
    
    total = query.count()
    logs = query.order_by(desc(ActivityLog.created_at)).offset((page-1) * page_size).limit(page_size).all()
    
    return {
        "items": [
            {
                "id": log.id,
                "action": log.action,
                "target_type": log.target_type,
                "target_id": log.target_id,
                "target_name": log.target_name,
                "details": log.details,
                "admin_id": log.admin_id,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size
    }
