# -*- coding: utf-8 -*-
"""
models package — backward-compatibility re-exports.

All existing symbols are re-exported from database.py.
RefreshToken lives in auth.py and is imported directly from there
(from app.models.auth import RefreshToken) to avoid circular imports.
Importing this package via `from app.models import X` continues to work
for all symbols that were previously in database.py.
"""

from .database import (  # noqa: F401
    Base,
    engine,
    SessionLocal,
    get_db,
    init_db,
    Admin,
    AdminRole,
    ModelType,
    Gender,
    Model,
    ModelFile,
    NewsArticle,
    SNSData,
    ShareLink,
    ActivityLog,
    Notification,
    ALL_PERMISSIONS,
    SUPER_ADMIN_PERMISSIONS,
    DEFAULT_USER_PERMISSIONS,
    ROLE_PERMISSIONS,
)
# Import search models so Base.metadata includes them before init_db() is called.
from .search import ModelNews, ModelSearchImage  # noqa: F401

__all__ = [
    "Base", "engine", "SessionLocal", "get_db", "init_db",
    "Admin", "AdminRole",
    "ModelType", "Gender", "Model", "ModelFile", "NewsArticle",
    "SNSData", "ShareLink", "ActivityLog", "Notification",
    "ALL_PERMISSIONS", "SUPER_ADMIN_PERMISSIONS",
    "DEFAULT_USER_PERMISSIONS", "ROLE_PERMISSIONS",
    "ModelNews", "ModelSearchImage",
]
