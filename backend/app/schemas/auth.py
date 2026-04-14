# -*- coding: utf-8 -*-
"""
Pydantic schemas for authentication and admin management.
"""

from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime
from enum import Enum


class AdminRoleEnum(str, Enum):
    SUPER_ADMIN = "super_admin"
    USER = "user"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str
    server_ip: Optional[str] = None


class RefreshRequest(BaseModel):
    refresh_token: str


class AdminBase(BaseModel):
    username: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: AdminRoleEnum = AdminRoleEnum.USER


class AdminCreate(AdminBase):
    password: str
    permissions: Optional[List[str]] = []


class AdminUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[AdminRoleEnum] = None
    is_active: Optional[bool] = None
    permissions: Optional[List[str]] = None


class AdminResponse(AdminBase):
    id: int
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    permissions: Union[dict, List[str]] = []

    class Config:
        from_attributes = True
