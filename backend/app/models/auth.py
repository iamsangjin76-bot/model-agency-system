# -*- coding: utf-8 -*-
"""
Auth-related database model additions.

Imports Base from database.py so that RefreshToken shares the same
SQLAlchemy metadata as all existing models. This ensures that the
existing init_db() call creates the refresh_tokens table as long as
this module is imported before create_all() runs.
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

# Share the single declarative Base from database.py.
# All other exports (Admin, AdminRole, constants, get_db, init_db) are
# re-exported for convenience — they live in database.py.
from app.models.database import (  # noqa: F401 — re-exported symbols
    Base,
    engine,
    SessionLocal,
    get_db,
    init_db,
    Admin,
    AdminRole,
    ALL_PERMISSIONS,
    SUPER_ADMIN_PERMISSIONS,
    DEFAULT_USER_PERMISSIONS,
    ROLE_PERMISSIONS,
)


class RefreshToken(Base):
    """
    Opaque refresh token table.

    Only the SHA-256 hash of the raw token is stored (NFR-1).
    The replaced_by column tracks the rotation chain for family-revocation
    reuse detection (R6).
    """

    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=False)
    # SHA-256 hex digest — 64 characters
    token_hash = Column(String(64), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    # Points to the successor token after rotation; NULL until rotated
    replaced_by = Column(Integer, ForeignKey("refresh_tokens.id"), nullable=True)

    # backref automatically adds Admin.refresh_tokens without touching database.py
    admin = relationship("Admin", backref="refresh_tokens")
