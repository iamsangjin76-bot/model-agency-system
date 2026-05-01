# -*- coding: utf-8 -*-
"""
Activity log and notification ORM models.

Separated from database.py to keep that module under the 300-line limit.
Symbols are re-exported via models/__init__.py so that
`from app.models.database import ActivityLog, Notification` keeps working.
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text

from app.models.database import Base


class ActivityLog(Base):
    """Admin action audit trail."""
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    action = Column(String(50), nullable=False)   # create, update, delete, login, logout
    target_type = Column(String(50))              # model, client, casting, contract, etc.
    target_id = Column(Integer)
    target_name = Column(String(200))             # human-readable label
    details = Column(Text)
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    """In-app notification for admin users."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(Text)
    notification_type = Column(String(50))        # casting, contract, settlement, system
    is_read = Column(Boolean, default=False)
    link_url = Column(String(200))                # URL to navigate on click
    target_type = Column(String(50), nullable=True)   # entity type for dedup/linking
    target_id = Column(Integer, nullable=True)         # entity ID for dedup/linking
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_notifications_admin_unread", "admin_id", "is_read"),
        Index("idx_notifications_admin_created", "admin_id", "created_at"),
        Index("idx_notifications_target", "target_type", "target_id"),
    )
