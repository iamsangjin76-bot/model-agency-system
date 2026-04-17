# -*- coding: utf-8 -*-
"""
Pydantic 스키마 정의
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Union
from datetime import datetime, date
from enum import Enum


# ============ ENUMS ============

class AdminRoleEnum(str, Enum):
    SUPER_ADMIN = "super_admin"
    USER = "user"


class ModelTypeEnum(str, Enum):
    NEW_MODEL = "new_model"
    INFLUENCER = "influencer"
    FOREIGN_MODEL = "foreign_model"
    CELEBRITY = "celebrity"


class GenderEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


# ============ AUTH SCHEMAS ============

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str
    server_ip: Optional[str] = None


class AdminBase(BaseModel):
    username: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: AdminRoleEnum = AdminRoleEnum.USER


class AdminCreate(AdminBase):
    password: str
    permissions: Optional[List[str]] = []  # 권한 리스트


class AdminUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[AdminRoleEnum] = None
    is_active: Optional[bool] = None
    permissions: Optional[List[str]] = None  # 권한 리스트


class AdminResponse(AdminBase):
    id: int
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    permissions: Union[dict, List[str]] = []  # 권한 (딕셔너리 또는 리스트)

    class Config:
        from_attributes = True


# ============ MODEL SCHEMAS ============

class ModelBase(BaseModel):
    name: str
    name_english: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[GenderEnum] = None
    model_type: ModelTypeEnum
    
    # 신체 정보
    height: Optional[int] = None
    weight: Optional[float] = None
    bust: Optional[int] = None
    waist: Optional[int] = None
    hip: Optional[int] = None
    shoe_size: Optional[int] = None
    
    # 소속사 정보
    agency_name: Optional[str] = None
    agency_phone: Optional[str] = None
    has_agency: bool = False
    has_manager: bool = False
    
    # 연락처
    contact1: Optional[str] = None
    contact2: Optional[str] = None
    personal_contact: Optional[str] = None
    contact_note: Optional[str] = None
    
    # 개인 정보
    school: Optional[str] = None
    debut: Optional[str] = None
    hobby: Optional[str] = None
    nationality: Optional[str] = None
    
    # SNS
    instagram_id: Optional[str] = None
    instagram_followers: Optional[int] = None
    youtube_id: Optional[str] = None
    youtube_subscribers: Optional[int] = None
    
    # 메모
    keywords: Optional[str] = None
    memo: Optional[str] = None


class ModelCreate(ModelBase):
    pass


class ModelUpdate(BaseModel):
    name: Optional[str] = None
    name_english: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[GenderEnum] = None
    model_type: Optional[ModelTypeEnum] = None
    height: Optional[int] = None
    weight: Optional[float] = None
    bust: Optional[int] = None
    waist: Optional[int] = None
    hip: Optional[int] = None
    shoe_size: Optional[int] = None
    agency_name: Optional[str] = None
    agency_phone: Optional[str] = None
    has_agency: Optional[bool] = None
    has_manager: Optional[bool] = None
    contact1: Optional[str] = None
    contact2: Optional[str] = None
    personal_contact: Optional[str] = None
    contact_note: Optional[str] = None
    school: Optional[str] = None
    debut: Optional[str] = None
    hobby: Optional[str] = None
    nationality: Optional[str] = None
    instagram_id: Optional[str] = None
    instagram_followers: Optional[int] = None
    youtube_id: Optional[str] = None
    youtube_subscribers: Optional[int] = None
    keywords: Optional[str] = None
    memo: Optional[str] = None
    is_active: Optional[bool] = None


class ModelResponse(ModelBase):
    id: int
    folder_path: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True


class ModelListResponse(BaseModel):
    id: int
    name: str
    name_english: Optional[str] = None
    model_type: ModelTypeEnum
    gender: Optional[GenderEnum] = None
    height: Optional[int] = None
    instagram_followers: Optional[int] = None
    profile_image: Optional[str] = None
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


# ============ CLIENT SCHEMAS ============

class ClientGradeEnum(str, Enum):
    VIP = "vip"
    GOLD = "gold"
    SILVER = "silver"
    NORMAL = "normal"


class IndustryEnum(str, Enum):
    COSMETICS = "cosmetics"
    FASHION = "fashion"
    FOOD = "food"
    ELECTRONICS = "electronics"
    AUTOMOBILE = "automobile"
    ENTERTAINMENT = "entertainment"
    RETAIL = "retail"
    OTHER = "other"


class ClientBase(BaseModel):
    name: str
    industry: IndustryEnum = IndustryEnum.OTHER
    grade: ClientGradeEnum = ClientGradeEnum.NORMAL
    contact_name: str
    contact_position: Optional[str] = None
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    memo: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[IndustryEnum] = None
    grade: Optional[ClientGradeEnum] = None
    contact_name: Optional[str] = None
    contact_position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    memo: Optional[str] = None
    is_favorite: Optional[bool] = None
    is_active: Optional[bool] = None


class ClientResponse(ClientBase):
    id: int
    is_favorite: bool = False
    total_projects: int = 0
    total_amount: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ CASTING SCHEMAS ============

class CastingStatusEnum(str, Enum):
    REQUEST = "request"
    REVIEWING = "reviewing"
    MATCHING = "matching"
    PROPOSED = "proposed"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CastingTypeEnum(str, Enum):
    CF = "cf"
    MAGAZINE = "magazine"
    EVENT = "event"
    SHOW = "show"
    DRAMA = "drama"
    MOVIE = "movie"
    OTHER = "other"


class CastingBase(BaseModel):
    title: str
    type: CastingTypeEnum = CastingTypeEnum.OTHER
    client_id: Optional[int] = None
    budget: Optional[int] = None
    shoot_date: Optional[date] = None
    location: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    deadline: Optional[date] = None


class CastingCreate(CastingBase):
    pass


class CastingUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[CastingTypeEnum] = None
    status: Optional[CastingStatusEnum] = None
    client_id: Optional[int] = None
    budget: Optional[int] = None
    shoot_date: Optional[date] = None
    location: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    deadline: Optional[date] = None


class CastingResponse(CastingBase):
    id: int
    status: CastingStatusEnum = CastingStatusEnum.REQUEST
    client_name: Optional[str] = None
    proposed_models: List[dict] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ CONTRACT SCHEMAS ============

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


class ContractBase(BaseModel):
    title: Optional[str] = None
    type: Optional[ContractTypeEnum] = ContractTypeEnum.PROJECT
    contract_type: Optional[ContractTypeEnum] = None  # 프론트 호환 필드
    model_id: Optional[int] = None
    client_id: Optional[int] = None
    model_name: Optional[str] = None
    client_name: Optional[str] = None
    amount: Optional[int] = None
    total_amount: Optional[int] = None  # 프론트 호환 필드
    agency_fee: Optional[int] = None
    model_fee: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None
    memo: Optional[str] = None  # 프론트 호환 필드
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


# ============ SETTLEMENT SCHEMAS ============

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


class SettlementBase(BaseModel):
    title: Optional[str] = None
    type: Optional[SettlementTypeEnum] = SettlementTypeEnum.EXPENSE
    settlement_type: Optional[SettlementTypeEnum] = None  # 프론트 호환 필드
    amount: int
    contract_id: Optional[int] = None
    model_id: Optional[int] = None
    client_id: Optional[int] = None
    due_date: Optional[date] = None
    payment_date: Optional[date] = None  # 프론트 호환 필드
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


# ============ SCHEDULE SCHEMAS ============

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


class ScheduleBase(BaseModel):
    title: str
    type: Optional[EventTypeEnum] = EventTypeEnum.OTHER
    schedule_type: Optional[EventTypeEnum] = None  # 프론트 호환 필드
    date: Optional[date] = None
    start_datetime: Optional[str] = None  # 프론트 호환 필드 (ISO datetime string)
    end_datetime: Optional[str] = None    # 프론트 호환 필드
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    model_id: Optional[int] = None
    client_id: Optional[int] = None
    casting_id: Optional[int] = None
    description: Optional[str] = None
    memo: Optional[str] = None  # 프론트 호환 필드
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
