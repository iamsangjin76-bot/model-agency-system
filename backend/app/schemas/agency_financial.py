# -*- coding: utf-8 -*-
"""
Pydantic schemas for financial and scheduling domain objects:
contracts, settlements, schedules, and pagination.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


# ============ CONTRACT ENUMS ============

class ContractStatusEnum(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"


class ContractTypeEnum(str, Enum):
    EXCLUSIVE = "exclusive"
    PROJECT = "project"
    ANNUAL = "annual"
    EVENT = "event"


# ============ CONTRACT SCHEMAS ============

class ContractBase(BaseModel):
    title: Optional[str] = None
    type: Optional[ContractTypeEnum] = ContractTypeEnum.PROJECT
    contract_type: Optional[ContractTypeEnum] = None
    model_id: Optional[int] = None
    client_id: Optional[int] = None
    model_name: Optional[str] = None
    client_name: Optional[str] = None
    amount: Optional[int] = None
    total_amount: Optional[int] = None
    agency_fee: Optional[int] = None
    model_fee: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None
    memo: Optional[str] = None
    status: Optional[ContractStatusEnum] = None


class ContractCreate(BaseModel):
    title: Optional[str] = None
    type: Optional[ContractTypeEnum] = ContractTypeEnum.PROJECT
    contract_type: Optional[ContractTypeEnum] = None
    model_id: Optional[int] = None
    client_id: Optional[int] = None
    model_name: Optional[str] = None
    client_name: Optional[str] = None
    amount: Optional[int] = None
    total_amount: Optional[int] = None
    agency_fee: Optional[int] = None
    model_fee: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None
    memo: Optional[str] = None
    status: Optional[ContractStatusEnum] = ContractStatusEnum.DRAFT


class ContractUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[ContractTypeEnum] = None
    status: Optional[ContractStatusEnum] = None
    amount: Optional[int] = None
    agency_fee: Optional[int] = None
    model_fee: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    signed_date: Optional[date] = None
    description: Optional[str] = None


class ContractResponse(ContractBase):
    id: int
    contract_number: str
    status: ContractStatusEnum = ContractStatusEnum.DRAFT
    signed_date: Optional[date] = None
    model_name: Optional[str] = None
    client_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ SETTLEMENT ENUMS ============

class SettlementStatusEnum(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class SettlementTypeEnum(str, Enum):
    MODEL_PAYMENT = "model_payment"
    AGENCY_FEE = "agency_fee"
    EXPENSE = "expense"
    REFUND = "refund"


# ============ SETTLEMENT SCHEMAS ============

class SettlementBase(BaseModel):
    title: Optional[str] = None
    type: Optional[SettlementTypeEnum] = SettlementTypeEnum.EXPENSE
    settlement_type: Optional[SettlementTypeEnum] = None
    amount: int
    contract_id: Optional[int] = None
    model_id: Optional[int] = None
    client_id: Optional[int] = None
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    bank_info: Optional[str] = None
    description: Optional[str] = None
    status: Optional[SettlementStatusEnum] = None


class SettlementCreate(BaseModel):
    title: Optional[str] = None
    type: Optional[SettlementTypeEnum] = SettlementTypeEnum.EXPENSE
    settlement_type: Optional[SettlementTypeEnum] = None
    amount: int
    contract_id: Optional[int] = None
    model_id: Optional[int] = None
    client_id: Optional[int] = None
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    bank_info: Optional[str] = None
    description: Optional[str] = None
    status: Optional[SettlementStatusEnum] = SettlementStatusEnum.PENDING


class SettlementUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[SettlementTypeEnum] = None
    status: Optional[SettlementStatusEnum] = None
    amount: Optional[int] = None
    due_date: Optional[date] = None
    paid_date: Optional[date] = None
    bank_info: Optional[str] = None
    description: Optional[str] = None


class SettlementResponse(SettlementBase):
    id: int
    status: SettlementStatusEnum = SettlementStatusEnum.PENDING
    paid_date: Optional[date] = None
    contract_number: Optional[str] = None
    model_name: Optional[str] = None
    client_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============ SCHEDULE ENUMS ============

class EventTypeEnum(str, Enum):
    SHOOTING = "shooting"
    MEETING = "meeting"
    EVENT = "event"
    AUDITION = "audition"
    FITTING = "fitting"
    OTHER = "other"


class ScheduleStatusEnum(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# ============ SCHEDULE SCHEMAS ============

class ScheduleBase(BaseModel):
    title: str
    type: Optional[EventTypeEnum] = EventTypeEnum.OTHER
    schedule_type: Optional[EventTypeEnum] = None
    date: Optional[date] = None
    start_datetime: Optional[str] = None
    end_datetime: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    model_id: Optional[int] = None
    client_id: Optional[int] = None
    casting_id: Optional[int] = None
    description: Optional[str] = None
    memo: Optional[str] = None
    status: Optional[ScheduleStatusEnum] = None


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[EventTypeEnum] = None
    status: Optional[ScheduleStatusEnum] = None
    date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    model_id: Optional[int] = None
    client_id: Optional[int] = None
    description: Optional[str] = None


class ScheduleResponse(ScheduleBase):
    id: int
    status: ScheduleStatusEnum = ScheduleStatusEnum.PENDING
    model_name: Optional[str] = None
    client_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============ PAGINATION ============

class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    page_size: int
    total_pages: int
