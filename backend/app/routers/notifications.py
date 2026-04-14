# coding: utf-8
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from pydantic import BaseModel

from app.models.database import get_db, Notification
from app.routers.auth import get_current_active_user

router = APIRouter()

class NotificationCreate(BaseModel):
    title: str
    message: Optional[str] = None
    notification_type: Optional[str] = None
    link_url: Optional[str] = None

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: Optional[str]
    notification_type: Optional[str]
    is_read: bool
    link_url: Optional[str]
    created_at: str

@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    query = db.query(Notification).filter(Notification.admin_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(desc(Notification.created_at)).offset((page-1) * page_size).limit(page_size).all()
    
    return [
        NotificationResponse(
            id=n.id,
            title=n.title,
            message=n.message,
            notification_type=n.notification_type,
            is_read=n.is_read,
            link_url=n.link_url,
            created_at=n.created_at.isoformat() if n.created_at else ""
        )
        for n in notifications
    ]

@router.get("/count")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    count = db.query(Notification).filter(
        Notification.admin_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}

@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.admin_id == current_user.id
    ).first()
    
    if not notification:
        return {"error": "Notification not found"}
    
    notification.is_read = True
    db.commit()
    
    return {"success": True}

@router.post("", response_model=NotificationResponse)
async def create_notification(
    notification: NotificationCreate,
    admin_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    db_notification = Notification(
        admin_id=admin_id,
        title=notification.title,
        message=notification.message,
        notification_type=notification.notification_type,
        link_url=notification.link_url
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    return NotificationResponse(
        id=db_notification.id,
        title=db_notification.title,
        message=db_notification.message,
        notification_type=db_notification.notification_type,
        is_read=db_notification.is_read,
        link_url=db_notification.link_url,
        created_at=db_notification.created_at.isoformat() if db_notification.created_at else ""
    )
