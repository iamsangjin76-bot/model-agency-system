# -*- coding: utf-8 -*-
"""
Background batch SNS sync runner.

Runs as a FastAPI BackgroundTask so it must create its own DB session
(the request-scoped session is already closed when the background runs).
"""

from __future__ import annotations

import logging
from datetime import datetime

logger = logging.getLogger(__name__)


async def run_batch(job_id: str, model_ids: list[int]) -> None:
    """Iterate over *model_ids*, sync Instagram + YouTube for each, and update SyncJob progress."""
    from app.models.database import SessionLocal, Model
    from app.models.sns import FollowerSnapshot, SyncJob
    from app.services.instagram_service import InstagramAPIError, fetch_profile as ig_fetch
    from app.services.youtube_service import YouTubeAPIError, fetch_channel as yt_fetch

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

            counter_field = "completed_count" if ok else "failed_count"
            db.query(SyncJob).filter(SyncJob.id == job_id).update(
                {counter_field: getattr(SyncJob, counter_field) + 1}
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
