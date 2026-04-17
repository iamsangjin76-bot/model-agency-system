# -*- coding: utf-8 -*-
"""
Extended Pydantic schemas for model detail endpoints.

Keeps schemas.py under the 300-line limit by isolating the
ModelDetailResponse class, which adds fields not present in ModelBase.
"""

from typing import Optional
from datetime import date

from app.schemas import ModelResponse


class ModelDetailResponse(ModelResponse):
    """
    Full model profile schema used by GET /models/{id}.

    Extends ModelResponse with fields that exist in the DB but are
    omitted from ModelBase to keep the list/create payloads lean.
    All fields are Optional with default None for backwards compatibility.
    """

    # Contact extra
    contact3: Optional[str] = None
    contact4: Optional[str] = None
    home_phone: Optional[str] = None

    # Agency extra
    agency_fax: Optional[str] = None

    # Foreign model fields
    passport_no: Optional[str] = None
    visa_type: Optional[str] = None
    languages: Optional[str] = None
    career_years: Optional[int] = None
    entry_date: Optional[date] = None
    departure_date: Optional[date] = None

    # Career history
    career_broadcast: Optional[str] = None
    career_movie: Optional[str] = None
    career_commercial: Optional[str] = None
    career_print_ad: Optional[str] = None
    career_theater: Optional[str] = None
    career_musical: Optional[str] = None
    career_fashion_show: Optional[str] = None
    career_music_video: Optional[str] = None
    career_album: Optional[str] = None
    career_other: Optional[str] = None

    # Model fee (celebrity-specific)
    model_fee_6month: Optional[int] = None
    model_fee_1year: Optional[int] = None
    current_works: Optional[str] = None
    current_ads: Optional[str] = None

    # SNS extra
    tiktok_id: Optional[str] = None
    tiktok_followers: Optional[int] = None

    class Config:
        from_attributes = True
