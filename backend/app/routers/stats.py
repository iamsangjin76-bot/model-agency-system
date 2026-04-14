# coding: utf-8
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.database import get_db, Model, NewsArticle, ShareLink
from app.routers.auth import get_current_active_user
from app.routers.castings import Casting

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    model_count = db.query(Model).filter(Model.is_active == True).count()
    casting_count = db.query(Casting).filter(Casting.created_at >= month_start).count()
    news_count = db.query(NewsArticle).count()
    share_count = db.query(ShareLink).filter(ShareLink.is_active == True).count()
    
    return {
        "model_count": model_count,
        "casting_count": casting_count,
        "news_count": news_count,
        "share_count": share_count,
    }
