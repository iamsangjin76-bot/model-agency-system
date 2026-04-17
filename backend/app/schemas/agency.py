# -*- coding: utf-8 -*-
"""
Pydantic schemas for agency domain objects: models, clients, castings.
Contract, settlement, and schedule schemas are in agency_financial.py.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


# ============ ENUMS ============

class ModelTypeEnum(str, Enum):
    NEW_MODEL = "new_model"
    INFLUENCER = "influencer"
    FOREIGN_MODEL = "foreign_model"
    CELEBRITY = "celebrity"


class GenderEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


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


# ============ MODEL SCHEMAS ============

class ModelBase(BaseModel):
    name: str
    name_english: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[GenderEnum] = None
    model_type: ModelTypeEnum
    height: Optional[int] = None
    weight: Optional[float] = None
    bust: Optional[int] = None
    waist: Optional[int] = None
    hip: Optional[int] = None
    shoe_size: Optional[int] = None
    agency_name: Optional[str] = None
    agency_phone: Optional[str] = None
    agency_fax: Optional[str] = None
    has_agency: bool = False
    has_manager: bool = False
    contact1: Optional[str] = None
    contact2: Optional[str] = None
    contact3: Optional[str] = None
    contact4: Optional[str] = None
    personal_contact: Optional[str] = None
    home_phone: Optional[str] = None
    contact_note: Optional[str] = None
    school: Optional[str] = None
    debut: Optional[str] = None
    hobby: Optional[str] = None
    nationality: Optional[str] = None
    passport_no: Optional[str] = None
    visa_type: Optional[str] = None
    languages: Optional[str] = None
    instagram_id: Optional[str] = None
    instagram_followers: Optional[int] = None
    youtube_id: Optional[str] = None
    youtube_subscribers: Optional[int] = None
    tiktok_id: Optional[str] = None
    tiktok_followers: Optional[int] = None
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
    agency_fax: Optional[str] = None
    has_agency: Optional[bool] = None
    has_manager: Optional[bool] = None
    contact1: Optional[str] = None
    contact2: Optional[str] = None
    contact3: Optional[str] = None
    contact4: Optional[str] = None
    personal_contact: Optional[str] = None
    home_phone: Optional[str] = None
    contact_note: Optional[str] = None
    school: Optional[str] = None
    debut: Optional[str] = None
    hobby: Optional[str] = None
    nationality: Optional[str] = None
    passport_no: Optional[str] = None
    visa_type: Optional[str] = None
    languages: Optional[str] = None
    career_years: Optional[int] = None
    entry_date: Optional[date] = None
    departure_date: Optional[date] = None
    career_broadcast: Optional[str] = None
    career_movie: Optional[str] = None
    career_commercial: Optional[str] = None
    career_print_ad: Optional[str] = None
    career_theater: Optional[str] = None
    career_album: Optional[str] = None
    career_musical: Optional[str] = None
    career_fashion_show: Optional[str] = None
    career_music_video: Optional[str] = None
    career_other: Optional[str] = None
    model_fee_6month: Optional[int] = None
    model_fee_1year: Optional[int] = None
    current_works: Optional[str] = None
    current_ads: Optional[str] = None
    instagram_id: Optional[str] = None
    instagram_followers: Optional[int] = None
    youtube_id: Optional[str] = None
    youtube_subscribers: Optional[int] = None
    tiktok_id: Optional[str] = None
    tiktok_followers: Optional[int] = None
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

class CastingBase(BaseModel):
    title: str
    type: CastingTypeEnum = CastingTypeEnum.OTHER
    client_id: int
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
