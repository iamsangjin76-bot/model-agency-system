# -*- coding: utf-8 -*-
"""
SNS Analytics Router

Endpoints:
  POST /sns/sync/{model_id}   — trigger Instagram sync for one model
  POST /sns/sync/batch        — trigger batch sync (background)
  GET  /sns/snapshots/{model_id} — time-series follower data
  GET  /sns/media/{model_id}     — recent post engagement
  GET  /sns/jobs/{job_id}        — batch job progress
  GET  /sns/status               — API configuration status
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.models.database import get_db, Model
from app.models.sns import FollowerSnapshot, MediaMetric, SyncJob
from app.routers.auth import require_permission
from app.services.instagram_service import (
    InstagramAPIError, InstagramNotConfiguredError, fetch_profile, parse_media_item,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# GET /status  — check whether Graph API is configured
# ---------------------------------------------------------------------------

@router.get("/status")
async def sns_status(_: Any = Depends(require_permission("sns", "view"))):
    """Return whether Instagram Graph API credentials are configured."""
    from app.config import settings
    configured = bool(
        settings.INSTAGRAM_ACCESS_TOKEN and settings.INSTAGRAM_MY_IG_USER_ID
    )
    return {"configured": configured}


# ---------------------------------------------------------------------------
# POST /sync/{model_id}  — sync a single model (synchronous, < 5s)
# ---------------------------------------------------------------------------

@router.post("/sync/{model_id}")
async def sync_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_permission("sns", "fetch")),
):
    """Fetch Instagram metrics for one model and persist a snapshot."""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다")

    ig_username = (model.instagram_id or "").lstrip("@").strip()
    if not ig_username:
        raise HTTPException(
            status_code=422,
            detail="모델에 인스타그램 계정(@)이 등록되어 있지 않습니다",
        )

    try:
        data = await fetch_profile(ig_username)
    except InstagramNotConfiguredError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except InstagramAPIError as e:
        raise HTTPException(status_code=502, detail=f"Instagram API 오류: {e}")

    # Persist follower snapshot
    snapshot = FollowerSnapshot(
        model_id=model_id,
        followers_count=data["followers_count"],
        follows_count=data["follows_count"],
        media_count=data["media_count"],
        source="graph_api",
        raw_response=data["raw_response"],
        sync_duration_ms=data["duration_ms"],
    )
    db.add(snapshot)

    # Persist media metrics (latest 10 posts)
    for item in data["media"]:
        db.add(MediaMetric(**parse_media_item(item, model_id)))

    # Update model's cached follower count for quick list display
    if data["followers_count"] is not None:
        model.instagram_followers = data["followers_count"]

    db.commit()
    db.refresh(snapshot)

    return {
        "ok": True,
        "snapshot_id": snapshot.id,
        "followers_count": data["followers_count"],
        "follows_count": data["follows_count"],
        "media_count": data["media_count"],
        "posts_synced": len(data["media"]),
        "duration_ms": data["duration_ms"],
    }


# ---------------------------------------------------------------------------
# POST /sync/batch  — sync all (or filtered) models (background)
# ---------------------------------------------------------------------------

async def _run_batch(job_id: str, model_ids: list[int]) -> None:
    """Background task: sync models one by one, update SyncJob progress."""
    from app.models.database import SessionLocal
    db = SessionLocal()
    try:
        db.query(SyncJob).filter(SyncJob.id == job_id).update({"status": "running"})
        db.commit()

        for mid in model_ids:
            model = db.query(Model).filter(Model.id == mid).first()
            if not model:
                continue
            ig_username = (model.instagram_id or "").lstrip("@").strip()
            if not ig_username:
                db.query(SyncJob).filter(SyncJob.id == job_id).update(
                    {"failed_count": SyncJob.failed_count + 1}
                )
                db.commit()
                continue
            try:
                data = await fetch_profile(ig_username)
                db.add(FollowerSnapshot(
                    model_id=mid,
                    followers_count=data["followers_count"],
                    follows_count=data["follows_count"],
                    media_count=data["media_count"],
                    source="graph_api",
                    raw_response=data["raw_response"],
                    sync_duration_ms=data["duration_ms"],
                ))
                for item in data["media"]:
                    db.add(MediaMetric(**parse_media_item(item, mid)))
                if data["followers_count"] is not None:
                    model.instagram_followers = data["followers_count"]
                db.query(SyncJob).filter(SyncJob.id == job_id).update(
                    {"completed_count": SyncJob.completed_count + 1}
                )
                db.commit()
            except Exception as exc:
                db.query(SyncJob).filter(SyncJob.id == job_id).update(
                    {"failed_count": SyncJob.failed_count + 1}
                )
                db.commit()

        db.query(SyncJob).filter(SyncJob.id == job_id).update(
            {"status": "completed", "completed_at": datetime.utcnow()}
        )
        db.commit()
    except Exception:
        db.query(SyncJob).filter(SyncJob.id == job_id).update({"status": "failed"})
        db.commit()
    finally:
        db.close()


@router.post("/sync/batch")
async def sync_batch(
    background_tasks: BackgroundTasks,
    model_type: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_permission("sns", "fetch")),
):
    """Queue background sync for models that have instagram_id set."""
    query = db.query(Model).filter(
        Model.is_active == True,  # noqa: E712
        Model.instagram_id.isnot(None),
        Model.instagram_id != "",
    )
    if model_type:
        from app.models.database import ModelType as MT
        try:
            query = query.filter(Model.model_type == MT(model_type))
        except ValueError:
            pass

    models = query.all()
    if not models:
        raise HTTPException(status_code=404, detail="동기화할 모델이 없습니다")

    job_id = str(uuid.uuid4())
    job = SyncJob(
        id=job_id,
        triggered_by=current_user.username,
        profile_count=len(models),
        status="queued",
    )
    db.add(job)
    db.commit()

    background_tasks.add_task(_run_batch, job_id, [m.id for m in models])
    return {"job_id": job_id, "profile_count": len(models), "status": "queued"}


# ---------------------------------------------------------------------------
# GET /jobs/{job_id}  — batch job progress
# ---------------------------------------------------------------------------

@router.get("/jobs/{job_id}")
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    _: Any = Depends(require_permission("sns", "view")),
):
    job = db.query(SyncJob).filter(SyncJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "id": job.id, "status": job.status,
        "profile_count": job.profile_count,
        "completed_count": job.completed_count,
        "failed_count": job.failed_count,
        "triggered_at": job.triggered_at,
        "completed_at": job.completed_at,
    }


# ---------------------------------------------------------------------------
# GET /snapshots/{model_id}  — follower time-series
# ---------------------------------------------------------------------------

@router.get("/snapshots/{model_id}")
def get_snapshots(
    model_id: int,
    limit: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    _: Any = Depends(require_permission("sns", "view")),
):
    """Return latest N follower snapshots for a model (newest first)."""
    rows = (
        db.query(FollowerSnapshot)
        .filter(FollowerSnapshot.model_id == model_id)
        .order_by(FollowerSnapshot.snapshot_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "model_id": model_id,
        "items": [
            {
                "id": r.id,
                "snapshot_at": r.snapshot_at,
                "followers_count": r.followers_count,
                "follows_count": r.follows_count,
                "media_count": r.media_count,
                "source": r.source,
                "duration_ms": r.sync_duration_ms,
            }
            for r in rows
        ],
    }


# ---------------------------------------------------------------------------
# GET /media/{model_id}  — recent post engagement
# ---------------------------------------------------------------------------

@router.get("/media/{model_id}")
def get_media(
    model_id: int,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: Any = Depends(require_permission("sns", "view")),
):
    """Return most recent media metrics for a model."""
    rows = (
        db.query(MediaMetric)
        .filter(MediaMetric.model_id == model_id)
        .order_by(MediaMetric.posted_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "model_id": model_id,
        "items": [
            {
                "id": r.id,
                "media_id": r.media_id,
                "media_type": r.media_type,
                "posted_at": r.posted_at,
                "like_count": r.like_count,
                "comment_count": r.comment_count,
                "caption_excerpt": r.caption_excerpt,
                "permalink": r.permalink,
            }
            for r in rows
        ],
    }
