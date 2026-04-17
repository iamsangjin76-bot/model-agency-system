# coding: utf-8
"""
Notification API router.
Notifications are system-generated only; no public POST endpoint.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from pydantic import BaseModel

from app.models.database import get_db, Notification
from app.routers.auth import get_current_active_user

router = APIRouter()


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: Optional[str]
    notification_type: Optional[str]
    is_read: bool
    link_url: Optional[str]
    target_type: Optional[str]
    target_id: Optional[int]
    created_at: str


def _to_response(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        id=n.id,
        title=n.title,
        message=n.message,
        notification_type=n.notification_type,
        is_read=n.is_read,
        link_url=n.link_url,
        target_type=n.target_type,
        target_id=n.target_id,
        created_at=n.created_at.isoformat() if n.created_at else "",
    )


@router.get("")
async def get_notifications(
    unread_only: bool = False,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """List notifications for the current user, newest first."""
    query = db.query(Notification).filter(Notification.admin_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)

    total = query.count()
    items = (
        query.order_by(desc(Notification.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {"total": total, "items": [_to_response(n) for n in items]}


@router.get("/count")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Return the number of unread notifications for the current user."""
    count = db.query(Notification).filter(
        Notification.admin_id == current_user.id,
        Notification.is_read == False,
    ).count()
    return {"unread_count": count}


@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Mark a single notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.admin_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다")
    notif.is_read = True
    db.commit()
    return {"success": True}


@router.patch("/read-all")
async def mark_all_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Mark all unread notifications as read for the current user."""
    updated = (
        db.query(Notification)
        .filter(Notification.admin_id == current_user.id, Notification.is_read == False)
        .update({"is_read": True})
    )
    db.commit()
    return {"updated_count": updated}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Delete a notification owned by the current user."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.admin_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다")
    db.delete(notif)
    db.commit()
    return {"message": "알림이 삭제되었습니다"}
