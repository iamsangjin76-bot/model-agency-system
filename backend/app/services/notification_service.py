# coding: utf-8
"""
Notification service: create and broadcast system notifications.
Only this module should insert rows into the notifications table.
"""

from typing import Optional
from sqlalchemy.orm import Session

from app.models.database import Notification, Admin


def create_notification(
    db: Session,
    admin_id: int,
    title: str,
    notification_type: str,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    message: Optional[str] = None,
    link_url: Optional[str] = None,
) -> Notification:
    """Insert a single notification for one admin."""
    notif = Notification(
        admin_id=admin_id,
        title=title,
        notification_type=notification_type,
        target_type=target_type,
        target_id=target_id,
        message=message,
        link_url=link_url,
    )
    db.add(notif)
    db.flush()  # get ID without committing; caller controls the transaction
    return notif


def notify_all_admins(
    db: Session,
    title: str,
    notification_type: str,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    message: Optional[str] = None,
    link_url: Optional[str] = None,
    exclude_admin_id: Optional[int] = None,
) -> int:
    """Broadcast a notification to every active admin, excluding the actor.

    Returns the number of notifications created.
    """
    query = db.query(Admin).filter(Admin.is_active == True)
    if exclude_admin_id is not None:
        query = query.filter(Admin.id != exclude_admin_id)

    admins = query.all()
    for admin in admins:
        create_notification(
            db=db,
            admin_id=admin.id,
            title=title,
            notification_type=notification_type,
            target_type=target_type,
            target_id=target_id,
            message=message,
            link_url=link_url,
        )
    db.flush()
    return len(admins)
