# -*- coding: utf-8 -*-
"""
SNS Analytics Router

Endpoints:
  GET  /sns/status               — API configuration status
  POST /sns/sync/{model_id}      — sync Instagram + YouTube for one model
  POST /sns/sync/batch           — batch sync (background)
  GET  /sns/snapshots/{model_id} — time-series follower/subscriber data
  GET  /sns/media/{model_id}     — recent Instagram post engagement
  GET  /sns/jobs/{job_id}        — batch job progress
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.models.database import get_db, Model
from app.models.sns import FollowerSnapshot, MediaMetric, SyncJob
from app.routers.auth import require_permission
from app.services.instagram_service import (
    InstagramAPIError, InstagramNotConfiguredError,
    fetch_profile as ig_fetch, parse_media_item,
)
from app.services.youtube_service import (
    YouTubeAPIError, YouTubeNotConfiguredError,
    fetch_channel as yt_fetch,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# GET /status
# ---------------------------------------------------------------------------

@router.get("/status")
async def sns_status(_: Any = Depends(require_permission("sns", "view"))):
    """Return configuration status for each supported platform."""
    from app.config import settings
    ig_ok = bool(settings.INSTAGRAM_ACCESS_TOKEN and settings.INSTAGRAM_MY_IG_USER_ID)
    yt_ok = bool(settings.YOUTUBE_API_KEY or settings.GOOGLE_API_KEY)
    return {
        "instagram": ig_ok,
        "youtube": yt_ok,
        "any_configured": ig_ok or yt_ok,
    }


# ---------------------------------------------------------------------------
# POST /sync/{model_id}  — sync all platforms for one model
# ---------------------------------------------------------------------------

@router.post("/sync/{model_id}")
async def sync_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_permission("sns", "fetch")),
):
    """Fetch Instagram + YouTube metrics and persist snapshots."""
    model = db.query(Model).filter(Model.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다")

    result: dict[str, Any] = {"ok": False, "instagram": None, "youtube": None}
    any_ok = False

    # ── Instagram ──────────────────────────────────────────────────────────
    ig_username = (model.instagram_id or "").lstrip("@").strip()
    if ig_username:
        try:
            ig = await ig_fetch(ig_username)
            db.add(FollowerSnapshot(
                model_id=model_id, platform="instagram",
                followers_count=ig["followers_count"],
                follows_count=ig["follows_count"],
                media_count=ig["media_count"],
                source="graph_api",
                raw_response=ig["raw_response"],
                sync_duration_ms=ig["duration_ms"],
            ))
            for item in ig["media"]:
                db.add(MediaMetric(**parse_media_item(item, model_id)))
            if ig["followers_count"] is not None:
                model.instagram_followers = ig["followers_count"]
            result["instagram"] = {
                "ok": True,
                "followers_count": ig["followers_count"],
                "follows_count": ig["follows_count"],
                "media_count": ig["media_count"],
                "posts_synced": len(ig["media"]),
            }
            any_ok = True
        except InstagramNotConfiguredError:
            result["instagram"] = {"ok": False, "error": "not_configured",
                                   "message": "Instagram Graph API 미설정"}
        except InstagramAPIError as e:
            result["instagram"] = {"ok": False, "error": "api_error", "message": str(e)}
    else:
        result["instagram"] = {"ok": False, "error": "no_id",
                               "message": "인스타그램 계정이 등록되지 않음"}

    # ── YouTube ────────────────────────────────────────────────────────────
    yt_id = (model.youtube_id or "").strip()
    if yt_id:
        try:
            yt = await yt_fetch(yt_id)
            sub = yt["subscriber_count"]
            db.add(FollowerSnapshot(
                model_id=model_id, platform="youtube",
                followers_count=sub if sub is not None else 0,
                media_count=yt["video_count"],
                source="youtube_api",
                raw_response=yt["raw_response"],
                sync_duration_ms=yt["duration_ms"],
            ))
            if sub is not None:
                model.youtube_subscribers = sub
            result["youtube"] = {
                "ok": True,
                "channel_title": yt["channel_title"],
                "subscriber_count": sub,
                "video_count": yt["video_count"],
                "view_count": yt["view_count"],
                "subscribers_hidden": yt["subscribers_hidden"],
            }
            any_ok = True
        except YouTubeNotConfiguredError:
            result["youtube"] = {"ok": False, "error": "not_configured",
                                 "message": "YouTube API Key 미설정"}
        except YouTubeAPIError as e:
            result["youtube"] = {"ok": False, "error": "api_error", "message": str(e)}
    else:
        result["youtube"] = {"ok": False, "error": "no_id",
                             "message": "유튜브 채널이 등록되지 않음"}

    if not any_ok:
        # Both failed with configuration errors — raise 503
        msgs = []
        for p in ("instagram", "youtube"):
            r = result.get(p) or {}
            if r.get("error") in ("not_configured", "api_error"):
                msgs.append(r.get("message", ""))
        raise HTTPException(status_code=503, detail=" / ".join(filter(None, msgs)))

    db.commit()
    result["ok"] = True
    return result


# ---------------------------------------------------------------------------
# POST /sync/batch
# ---------------------------------------------------------------------------

async def _run_batch(job_id: str, model_ids: list[int]) -> None:
    from app.models.database import SessionLocal
    db = SessionLocal()
    try:
        db.query(SyncJob).filter(SyncJob.id == job_id).update({"status": "running"})
        db.commit()
        for mid in model_ids:
            model = db.query(Model).filter(Model.id == mid).first()
            if not model:
                continue
            ok = False
            ig_username = (model.instagram_id or "").lstrip("@").strip()
            if ig_username:
                try:
                    ig = await ig_fetch(ig_username)
                    db.add(FollowerSnapshot(
                        model_id=mid, platform="instagram",
                        followers_count=ig["followers_count"],
                        follows_count=ig["follows_count"],
                        media_count=ig["media_count"],
                        source="graph_api",
                        sync_duration_ms=ig["duration_ms"],
                    ))
                    if ig["followers_count"] is not None:
                        model.instagram_followers = ig["followers_count"]
                    ok = True
                except Exception as e:
                    logger.warning("Batch IG sync failed for model %d: %s", mid, e)
            yt_id = (model.youtube_id or "").strip()
            if yt_id:
                try:
                    yt = await yt_fetch(yt_id)
                    db.add(FollowerSnapshot(
                        model_id=mid, platform="youtube",
                        followers_count=yt["subscriber_count"] or 0,
                        media_count=yt["video_count"],
                        source="youtube_api",
                    ))
                    if yt["subscriber_count"] is not None:
                        model.youtube_subscribers = yt["subscriber_count"]
                    ok = True
                except Exception as e:
                    logger.warning("Batch YT sync failed for model %d: %s", mid, e)
            if ok:
                db.query(SyncJob).filter(SyncJob.id == job_id).update(
                    {"completed_count": SyncJob.completed_count + 1}
                )
            else:
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
    query = db.query(Model).filter(Model.is_active == True)  # noqa: E712
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
    db.add(SyncJob(id=job_id, triggered_by=current_user.username,
                   profile_count=len(models), status="queued"))
    db.commit()
    background_tasks.add_task(_run_batch, job_id, [m.id for m in models])
    return {"job_id": job_id, "profile_count": len(models), "status": "queued"}


# ---------------------------------------------------------------------------
# GET /jobs/{job_id}
# ---------------------------------------------------------------------------

@router.get("/jobs/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db),
            _: Any = Depends(require_permission("sns", "view"))):
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
# GET /snapshots/{model_id}
# ---------------------------------------------------------------------------

@router.get("/snapshots/{model_id}")
def get_snapshots(
    model_id: int,
    platform: str = Query("instagram"),
    limit: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    _: Any = Depends(require_permission("sns", "view")),
):
    rows = (
        db.query(FollowerSnapshot)
        .filter(FollowerSnapshot.model_id == model_id,
                FollowerSnapshot.platform == platform)
        .order_by(FollowerSnapshot.snapshot_at.desc())
        .limit(limit).all()
    )
    return {
        "model_id": model_id,
        "platform": platform,
        "items": [
            {"id": r.id, "snapshot_at": r.snapshot_at,
             "followers_count": r.followers_count,
             "follows_count": r.follows_count,
             "media_count": r.media_count,
             "source": r.source, "duration_ms": r.sync_duration_ms}
            for r in rows
        ],
    }


# ---------------------------------------------------------------------------
# GET /media/{model_id}
# ---------------------------------------------------------------------------

@router.get("/media/{model_id}")
def get_media(
    model_id: int,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: Any = Depends(require_permission("sns", "view")),
):
    rows = (
        db.query(MediaMetric)
        .filter(MediaMetric.model_id == model_id)
        .order_by(MediaMetric.posted_at.desc())
        .limit(limit).all()
    )
    return {
        "model_id": model_id,
        "items": [
            {"id": r.id, "media_id": r.media_id, "media_type": r.media_type,
             "posted_at": r.posted_at, "like_count": r.like_count,
             "comment_count": r.comment_count, "caption_excerpt": r.caption_excerpt,
             "permalink": r.permalink}
            for r in rows
        ],
    }
