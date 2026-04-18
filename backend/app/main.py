# -*- coding: utf-8
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.models.database import init_db
from app.routers import (
    auth, models, clients, castings, contracts, settlements,
    schedules, files, media, stats, activity_logs, notifications,
    token_refresh, news, image_search,
)
from app.services.token_service import cleanup_expired_tokens


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[START] Starting Model Agency Management System...")
    init_db()
    print("[OK] Database initialized")

    # Clean up expired refresh tokens on startup
    from app.models.database import SessionLocal
    db = SessionLocal()
    try:
        deleted = cleanup_expired_tokens(db)
        print(f"[OK] Token cleanup: {deleted} expired tokens removed")
    finally:
        db.close()

    yield
    print("[STOP] Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Model Agency Management System API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

if os.path.exists(settings.MODEL_FILES_DIR):
    app.mount("/model_files", StaticFiles(directory=settings.MODEL_FILES_DIR), name="model_files")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(token_refresh.router, prefix="/api/auth", tags=["auth"])
app.include_router(models.router, prefix="/api/models", tags=["models"])
app.include_router(clients.router, prefix="/api/clients", tags=["clients"])
app.include_router(castings.router, prefix="/api/castings", tags=["castings"])
app.include_router(contracts.router, prefix="/api/contracts", tags=["contracts"])
app.include_router(settlements.router, prefix="/api/settlements", tags=["settlements"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["schedules"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(media.router, prefix="/api/media", tags=["media"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
app.include_router(activity_logs.router, prefix="/api/activity-logs", tags=["activity-logs"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(news.router, prefix="/api/news", tags=["news"])
app.include_router(image_search.router, prefix="/api/image-search", tags=["image-search"])


@app.get("/")
async def root():
    return {
        "message": "Model Agency Management System API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
