# -*- coding: utf-8 -*-
"""
SNS-related ORM models: FollowerSnapshot, MediaMetric, SyncJob.

Stores time-series Instagram metrics collected via Graph API Business Discovery.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, JSON, Index,
)
from sqlalchemy.orm import relationship

from .database import Base


class FollowerSnapshot(Base):
    """One row per sync event — follower/following/media counts at a point in time."""

    __tablename__ = "follower_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    snapshot_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    followers_count = Column(Integer, nullable=False)
    follows_count = Column(Integer)
    media_count = Column(Integer)
    source = Column(String(20), nullable=False)   # graph_api | manual
    raw_response = Column(JSON)                    # full API response (audit trail)
    sync_duration_ms = Column(Integer)

    model = relationship("Model", back_populates="follower_snapshots")

    __table_args__ = (
        Index("idx_snap_model_time", "model_id", "snapshot_at"),
    )


class MediaMetric(Base):
    """Per-post engagement data captured during a sync (latest N posts)."""

    __tablename__ = "media_metrics"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    snapshot_at = Column(DateTime, default=datetime.utcnow)
    media_id = Column(String(50))
    media_type = Column(String(20))      # IMAGE | VIDEO | CAROUSEL_ALBUM
    posted_at = Column(DateTime)
    like_count = Column(Integer)
    comment_count = Column(Integer)
    caption_excerpt = Column(Text)       # first 100 chars only (copyright)
    permalink = Column(Text)

    model = relationship("Model", back_populates="media_metrics")

    __table_args__ = (
        Index("idx_media_model_posted", "model_id", "posted_at"),
    )


class SyncJob(Base):
    """Tracks progress of batch sync operations."""

    __tablename__ = "sync_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    triggered_by = Column(String(100))
    triggered_at = Column(DateTime, default=datetime.utcnow)
    profile_count = Column(Integer, default=0)
    completed_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    status = Column(String(20), default="queued")   # queued/running/completed/failed
    error_log = Column(Text)
    completed_at = Column(DateTime)
