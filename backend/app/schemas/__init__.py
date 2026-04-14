# -*- coding: utf-8 -*-
"""
Package re-exports for backward compatibility.

All existing code that does `from app.schemas import X` continues to work.
"""

from .auth import (
    AdminRoleEnum,
    Token,
    TokenData,
    LoginRequest,
    RefreshRequest,
    AdminBase,
    AdminCreate,
    AdminUpdate,
    AdminResponse,
)
from .agency import (
    ModelTypeEnum,
    GenderEnum,
    ModelBase,
    ModelCreate,
    ModelUpdate,
    ModelResponse,
    ModelListResponse,
    ClientGradeEnum,
    IndustryEnum,
    ClientBase,
    ClientCreate,
    ClientUpdate,
    ClientResponse,
    CastingStatusEnum,
    CastingTypeEnum,
    CastingBase,
    CastingCreate,
    CastingUpdate,
    CastingResponse,
)
from .agency_financial import (
    ContractStatusEnum,
    ContractTypeEnum,
    ContractBase,
    ContractCreate,
    ContractUpdate,
    ContractResponse,
    SettlementStatusEnum,
    SettlementTypeEnum,
    SettlementBase,
    SettlementCreate,
    SettlementUpdate,
    SettlementResponse,
    EventTypeEnum,
    ScheduleStatusEnum,
    ScheduleBase,
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleResponse,
    PaginatedResponse,
)

__all__ = [
    # auth
    "AdminRoleEnum", "Token", "TokenData", "LoginRequest", "RefreshRequest",
    "AdminBase", "AdminCreate", "AdminUpdate", "AdminResponse",
    # agency — model/client/casting
    "ModelTypeEnum", "GenderEnum",
    "ModelBase", "ModelCreate", "ModelUpdate", "ModelResponse", "ModelListResponse",
    "ClientGradeEnum", "IndustryEnum",
    "ClientBase", "ClientCreate", "ClientUpdate", "ClientResponse",
    "CastingStatusEnum", "CastingTypeEnum",
    "CastingBase", "CastingCreate", "CastingUpdate", "CastingResponse",
    # agency — contracts/settlements/schedules
    "ContractStatusEnum", "ContractTypeEnum",
    "ContractBase", "ContractCreate", "ContractUpdate", "ContractResponse",
    "SettlementStatusEnum", "SettlementTypeEnum",
    "SettlementBase", "SettlementCreate", "SettlementUpdate", "SettlementResponse",
    "EventTypeEnum", "ScheduleStatusEnum",
    "ScheduleBase", "ScheduleCreate", "ScheduleUpdate", "ScheduleResponse",
    "PaginatedResponse",
]
