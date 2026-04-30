# -*- coding: utf-8
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.models.database import init_db
import app.models.sns  # noqa: F401 — ensure SNS tables are registered before init_db()
from app.routers import (
    auth, models, clients, castings, contracts, settlements,
    schedules, files, media, stats, activity_logs, notifications,
    token_refresh, news, image_search, proxy, sns, export, backup,
)
from app.services.token_service import cleanup_expired_tokens


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[START] Starting Model Agency Management System...")
    init_db()
    print("[OK] Database initialized")

    # Auto-create super admin if no admin exists
    from app.models.database import SessionLocal, Admin, AdminRole, ROLE_PERMISSIONS
    from app.routers.auth import get_password_hash
    db = SessionLocal()
    try:
        existing = db.query(Admin).first()
        if not existing:
            super_admin = Admin(
                username="admin",
                password_hash=get_password_hash("ProjectM2026!"),
                name="조해은",
                email="admin@project-m.co.kr",
                role=AdminRole.SUPER_ADMIN,
                permissions=ROLE_PERMISSIONS.get(AdminRole.SUPER_ADMIN, {}),
            )
            db.add(super_admin)
            db.commit()
            print("[OK] Default super admin created: admin / ProjectM2026!")
        # Reset admin password if RESET_ADMIN_PASSWORD env var is set
        reset_pw = os.environ.get("RESET_ADMIN_PASSWORD", "")
        if reset_pw and existing:
            existing.password_hash = get_password_hash(reset_pw)
            db.commit()
            print(f"[OK] Admin password reset via RESET_ADMIN_PASSWORD env var")
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
app.include_router(proxy.router, prefix="/api/proxy", tags=["proxy"])
app.include_router(sns.router, prefix="/api/sns", tags=["sns"])
app.include_router(export.router, prefix="/api/export", tags=["export"])
app.include_router(backup.router, prefix="/api/backup", tags=["backup"])


@app.get("/")
async def root():
    """Serve frontend SPA at root, or API info if dist not built."""
    from fastapi.responses import FileResponse
    _idx = os.path.join(_FRONTEND_DIST, "index.html")
    if os.path.exists(_idx):
        return FileResponse(_idx)
    return {"message": "Model Agency Management System API", "version": settings.APP_VERSION, "docs": "/docs"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}


# Serve built frontend (SPA) — mount AFTER all API routes
_FRONTEND_DIST = os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")
)
print(f"[SPA] dist path: {_FRONTEND_DIST} | exists: {os.path.exists(_FRONTEND_DIST)}")
if os.path.exists(_FRONTEND_DIST):
    from fastapi.responses import FileResponse as _FR, JSONResponse as _JR
    from fastapi.staticfiles import StaticFiles as _SF
    from starlette.requests import Request as _Req

    # Serve CSS/JS/image assets
    _assets_dir = os.path.join(_FRONTEND_DIST, "assets")
    if os.path.exists(_assets_dir):
        app.mount("/assets", _SF(directory=_assets_dir), name="spa-assets")

    # SPA catch-all: serve index.html for any non-API 404
    @app.exception_handler(404)
    async def spa_404(_req: _Req, _exc):
        if _req.url.path.startswith("/api/"):
            return _JR({"detail": "Not Found"}, status_code=404)
        return _FR(os.path.join(_FRONTEND_DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
