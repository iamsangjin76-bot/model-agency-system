# -*- coding: utf-8 -*-
"""
Role-based permission definitions.

Separated from database.py to keep that module under the 300-line limit.
Symbols are re-exported from database.py and models/__init__.py so that
existing `from app.models.database import ROLE_PERMISSIONS` calls keep working.
"""

from app.models.database import AdminRole

# All configurable resource keys and their display labels
ALL_PERMISSIONS: dict[str, str] = {
    "model": "모델 관리",
    "news": "뉴스 검색",
    "image": "이미지 검색",
    "profile": "프로필 다운로드",
    "sns": "SNS 분석",
    "casting": "캐스팅 관리",
    "client": "고객 관리",
    "schedule": "일정 관리",
    "contract": "계약 관리",
    "settlement": "정산 관리",
    "share": "외부 공유",
    "settings": "시스템 설정",
}

# Convenience lists for quick role bootstrap
SUPER_ADMIN_PERMISSIONS: list[str] = list(ALL_PERMISSIONS.keys()) + ["admin"]
DEFAULT_USER_PERMISSIONS: list[str] = []  # granted individually by SUPER_ADMIN

# Full permission map used by auth.py and the register endpoint
ROLE_PERMISSIONS: dict = {
    AdminRole.SUPER_ADMIN: {
        "model": ["create", "read", "update", "delete", "export"],
        "admin": ["create", "read", "update", "delete"],
        "news": ["search", "save", "delete"],
        "image": ["search", "save", "delete"],
        "profile": ["generate", "download", "share"],
        "sns": ["fetch", "view"],
        "casting": ["create", "read", "update", "delete"],
        "client": ["create", "read", "update", "delete"],
        "schedule": ["create", "read", "update", "delete"],
        "contract": ["create", "read", "update", "delete"],
        "settlement": ["create", "read", "update", "delete"],
        "share": ["create", "read", "delete"],
        "settings": ["view", "modify"],
    },
    AdminRole.USER: {
        # Empty by default — SUPER_ADMIN assigns per-user permissions individually.
    },
}
