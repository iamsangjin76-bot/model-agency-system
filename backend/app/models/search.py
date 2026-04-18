# -*- coding: utf-8 -*-
"""
Search-related ORM models: ModelNews and ModelSearchImage.

These are separate tables from the legacy news_articles table.
The legacy NewsArticle / news_articles table is intentionally left untouched.
"""

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base


class ModelNews(Base):
    """Saved news articles linked to a model (model_news table)."""

    __tablename__ = "model_news"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)

    title = Column(String(500), nullable=False)
    link = Column(String(2048), nullable=False)
    description = Column(Text)
    pub_date = Column(String(50))           # ISO 8601
    source = Column(String(200))            # news outlet name
    image_url = Column(String(2048))        # optional thumbnail
    provider = Column(String(20), nullable=False)   # "naver" | "google"
    saved_path = Column(String(500))        # relative path of local JSON file
    memo = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("Model", back_populates="saved_news")

    __table_args__ = (
        UniqueConstraint("model_id", "link", name="uq_model_news_link"),
        Index("idx_news_model_id", "model_id"),
        Index("idx_news_created", "created_at"),
    )


class ModelSearchImage(Base):
    """Search images downloaded and linked to a model (model_search_images table)."""

    __tablename__ = "model_search_images"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)

    original_url = Column(String(2048), nullable=False)
    local_path = Column(String(500), nullable=False)    # relative path under uploads/
    filename = Column(String(255), nullable=False)      # UUID-based filename on disk
    width = Column(Integer)
    height = Column(Integer)
    file_size = Column(Integer)
    source = Column(String(200))            # origin site domain
    provider = Column(String(20), nullable=False)       # "naver" | "google"
    memo = Column(Text)
    is_portfolio = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("Model", back_populates="search_images")

    __table_args__ = (
        UniqueConstraint("model_id", "original_url", name="uq_model_search_image_url"),
        Index("idx_simg_model_id", "model_id"),
        Index("idx_simg_portfolio", "model_id", "is_portfolio"),
        Index("idx_simg_created", "created_at"),
    )
